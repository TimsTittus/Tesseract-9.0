import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { Ticket, FormField } from '@/types';
import { Plus, Edit2, Trash2, Power, X, Image } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const FIELD_TYPES = ['text', 'email', 'tel', 'number', 'textarea', 'select', 'checkbox'] as const;

const emptyTicket: Partial<Ticket> = {
  title: '',
  description: '',
  price: 0,
  is_active: true,
  form_fields: [],
  max_registrations: null,
};

const emptyField: FormField = {
  id: '',
  label: '',
  type: 'text',
  required: false,
  options: [],
  placeholder: '',
};

const AdminTickets = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Partial<Ticket>>(emptyTicket);
  const [saving, setSaving] = useState(false);

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setTickets(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const openCreateDialog = () => {
    setEditingTicket(emptyTicket);
    setDialogOpen(true);
  };

  const openEditDialog = (ticket: Ticket) => {
    setEditingTicket({ ...ticket });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingTicket.title?.trim()) {
      toast({ title: 'Validation Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    setSaving(true);

    if (editingTicket.id) {
      const { error } = await supabase
        .from('tickets')
        .update({
          title: editingTicket.title,
          description: editingTicket.description,
          price: editingTicket.price,
          is_active: editingTicket.is_active,
          form_fields: editingTicket.form_fields,
          max_registrations: editingTicket.max_registrations,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTicket.id);

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Ticket updated' });
        setDialogOpen(false);
        fetchTickets();
      }
    } else {
      const { error } = await supabase.from('tickets').insert({
        title: editingTicket.title,
        description: editingTicket.description,
        price: editingTicket.price || 0,
        is_active: editingTicket.is_active ?? true,
        form_fields: editingTicket.form_fields || [],
        max_registrations: editingTicket.max_registrations,
      });

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Ticket created' });
        setDialogOpen(false);
        fetchTickets();
      }
    }

    setSaving(false);
  };

  const handleToggleActive = async (ticket: Ticket) => {
    const { error } = await supabase
      .from('tickets')
      .update({ is_active: !ticket.is_active })
      .eq('id', ticket.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      fetchTickets();
    }
  };

  const handleDelete = async (ticket: Ticket) => {
    if (!confirm(`Delete "${ticket.title}"? This cannot be undone.`)) return;

    const { error } = await supabase.from('tickets').delete().eq('id', ticket.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Ticket removed' });
      fetchTickets();
    }
  };

  const addFormField = () => {
    const newField: FormField = {
      ...emptyField,
      id: `field_${Date.now()}`,
    };
    setEditingTicket({
      ...editingTicket,
      form_fields: [...(editingTicket.form_fields || []), newField],
    });
  };

  const updateFormField = (index: number, updates: Partial<FormField>) => {
    const fields = [...(editingTicket.form_fields || [])];
    fields[index] = { ...fields[index], ...updates };
    setEditingTicket({ ...editingTicket, form_fields: fields });
  };

  const removeFormField = (index: number) => {
    const fields = [...(editingTicket.form_fields || [])];
    fields.splice(index, 1);
    setEditingTicket({ ...editingTicket, form_fields: fields });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display text-primary glow-text tracking-wider">
              TICKETS
            </h2>
            <p className="text-muted-foreground font-mono text-sm mt-1">
              Manage event tickets and registration forms
            </p>
          </div>
          <button
            onClick={openCreateDialog}
            className="flex items-center justify-center gap-2 bg-primary text-background px-4 py-2 font-display font-bold rounded hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" />
            NEW TICKET
          </button>
        </div>

        {loading ? (
          <div className="text-primary font-mono animate-pulse">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="terminal-card p-8 text-center">
            <p className="text-muted-foreground font-mono">No tickets created yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`terminal-card p-4 ${!ticket.is_active ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-primary">{ticket.title}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-mono ${ticket.is_active
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-red-500/20 text-red-500'
                          }`}
                      >
                        {ticket.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono mt-1">
                      ₹{ticket.price} • {ticket.form_fields?.length || 0} custom fields
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/tickets/${ticket.id}/template`}
                      className="p-2 rounded hover:bg-secondary/50 transition-colors text-primary"
                      title="Edit Ticket Template"
                    >
                      <Image className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleToggleActive(ticket)}
                      className={`p-2 rounded hover:bg-secondary/50 transition-colors ${ticket.is_active ? 'text-green-500' : 'text-muted-foreground'
                        }`}
                      title={ticket.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditDialog(ticket)}
                      className="p-2 rounded hover:bg-secondary/50 transition-colors text-primary"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ticket)}
                      className="p-2 rounded hover:bg-secondary/50 transition-colors text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="terminal-card border-primary/30 max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-display text-primary tracking-wider">
              {editingTicket.id ? 'EDIT TICKET' : 'CREATE TICKET'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm text-primary/80 font-mono mb-2">TITLE *</label>
              <input
                type="text"
                value={editingTicket.title || ''}
                onChange={(e) => setEditingTicket({ ...editingTicket, title: e.target.value })}
                className="w-full bg-background border border-border rounded px-4 py-2 text-primary font-mono focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Event Name"
              />
            </div>

            <div>
              <label className="block text-sm text-primary/80 font-mono mb-2">DESCRIPTION</label>
              <textarea
                value={editingTicket.description || ''}
                onChange={(e) => setEditingTicket({ ...editingTicket, description: e.target.value })}
                className="w-full bg-background border border-border rounded px-4 py-2 text-primary font-mono focus:border-primary focus:ring-1 focus:ring-primary h-20 resize-none"
                placeholder="Event description..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-primary/80 font-mono mb-2">PRICE (₹)</label>
                <input
                  type="number"
                  value={editingTicket.price || 0}
                  onChange={(e) => setEditingTicket({ ...editingTicket, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-background border border-border rounded px-4 py-2 text-primary font-mono focus:border-primary focus:ring-1 focus:ring-primary"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm text-primary/80 font-mono mb-2">MAX REGISTRATIONS</label>
                <input
                  type="number"
                  value={editingTicket.max_registrations || ''}
                  onChange={(e) => setEditingTicket({ ...editingTicket, max_registrations: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full bg-background border border-border rounded px-4 py-2 text-primary font-mono focus:border-primary focus:ring-1 focus:ring-primary"
                  min="0"
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={editingTicket.is_active ?? true}
                onChange={(e) => setEditingTicket({ ...editingTicket, is_active: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <label htmlFor="is_active" className="text-sm text-primary/80 font-mono">
                Active (visible to users)
              </label>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm text-primary/80 font-mono">CUSTOM FORM FIELDS</label>
                <button
                  type="button"
                  onClick={addFormField}
                  className="text-xs bg-secondary text-primary px-3 py-1 rounded font-mono hover:bg-secondary/80"
                >
                  + Add Field
                </button>
              </div>

              {(editingTicket.form_fields || []).length === 0 ? (
                <p className="text-sm text-muted-foreground font-mono text-center py-4">
                  No custom fields. User profile data (name, email, phone) is collected by default.
                </p>
              ) : (
                <div className="space-y-3">
                  {(editingTicket.form_fields || []).map((field, index) => (
                    <div key={field.id} className="bg-secondary/20 p-3 rounded border border-border">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateFormField(index, { label: e.target.value })}
                            className="bg-background border border-border rounded px-3 py-1.5 text-sm text-primary font-mono"
                            placeholder="Field Label"
                          />
                          <select
                            value={field.type}
                            onChange={(e) => updateFormField(index, { type: e.target.value as FormField['type'] })}
                            className="bg-background border border-border rounded px-3 py-1.5 text-sm text-primary font-mono"
                          >
                            {FIELD_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFormField(index)}
                          className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateFormField(index, { required: e.target.checked })}
                            className="w-3 h-3 accent-primary"
                          />
                          Required
                        </label>
                        {field.type === 'select' && (
                          <input
                            type="text"
                            value={field.options?.join(', ') || ''}
                            onChange={(e) => updateFormField(index, { options: e.target.value.split(',').map(s => s.trim()) })}
                            className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs text-primary font-mono"
                            placeholder="Options (comma separated)"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 border border-border rounded font-mono text-sm hover:bg-secondary/50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary text-background rounded font-display font-bold hover:scale-105 transition-transform disabled:opacity-50"
              >
                {saving ? 'SAVING...' : 'SAVE'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminTickets;
