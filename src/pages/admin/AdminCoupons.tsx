import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { FoodCoupon, Ticket } from '@/types';
import { Plus, Edit2, Trash2, X, Check, UtensilsCrossed } from 'lucide-react';

const AdminCoupons = () => {
    const { toast } = useToast();
    const [coupons, setCoupons] = useState<FoodCoupon[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<FoodCoupon | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        ticket_ids: [] as string[],
        quantity: 1,
        is_active: true,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch coupons
            const { data: couponsData, error: couponsError } = await supabase
                .from('food_coupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (couponsError) throw couponsError;
            setCoupons(couponsData || []);

            // Fetch tickets for the dropdown
            const { data: ticketsData, error: ticketsError } = await supabase
                .from('tickets')
                .select('*')
                .order('title');

            if (ticketsError) throw ticketsError;
            setTickets(ticketsData || []);
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to load data.',
                variant: 'destructive',
            });
        }
        setLoading(false);
    };

    const handleOpenForm = (coupon?: FoodCoupon) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                name: coupon.name,
                ticket_ids: coupon.ticket_ids || [],
                quantity: coupon.quantity,
                is_active: coupon.is_active,
            });
        } else {
            setEditingCoupon(null);
            setFormData({
                name: '',
                ticket_ids: [],
                quantity: 1,
                is_active: true,
            });
        }
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingCoupon(null);
        setFormData({
            name: '',
            ticket_ids: [],
            quantity: 1,
            is_active: true,
        });
    };

    const handleTicketToggle = (ticketId: string) => {
        setFormData(prev => ({
            ...prev,
            ticket_ids: prev.ticket_ids.includes(ticketId)
                ? prev.ticket_ids.filter(id => id !== ticketId)
                : [...prev.ticket_ids, ticketId],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast({
                title: 'Error',
                description: 'Coupon name is required.',
                variant: 'destructive',
            });
            return;
        }

        if (formData.ticket_ids.length === 0) {
            toast({
                title: 'Error',
                description: 'Please select at least one ticket type.',
                variant: 'destructive',
            });
            return;
        }

        setSaving(true);

        try {
            if (editingCoupon) {
                // Update existing coupon
                const { error } = await supabase
                    .from('food_coupons')
                    .update({
                        name: formData.name.trim(),
                        ticket_ids: formData.ticket_ids,
                        quantity: formData.quantity,
                        is_active: formData.is_active,
                    })
                    .eq('id', editingCoupon.id);

                if (error) throw error;

                toast({
                    title: 'Success',
                    description: 'Coupon updated successfully.',
                });
            } else {
                // Create new coupon
                const { error } = await supabase
                    .from('food_coupons')
                    .insert({
                        name: formData.name.trim(),
                        ticket_ids: formData.ticket_ids,
                        quantity: formData.quantity,
                        is_active: formData.is_active,
                    });

                if (error) throw error;

                toast({
                    title: 'Success',
                    description: 'Coupon created successfully.',
                });
            }

            handleCloseForm();
            fetchData();
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to save coupon.',
                variant: 'destructive',
            });
        }

        setSaving(false);
    };

    const handleDelete = async (coupon: FoodCoupon) => {
        if (!confirm(`Are you sure you want to delete "${coupon.name}"?`)) return;

        try {
            const { error } = await supabase
                .from('food_coupons')
                .delete()
                .eq('id', coupon.id);

            if (error) throw error;

            toast({
                title: 'Deleted',
                description: 'Coupon deleted successfully.',
            });

            fetchData();
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to delete coupon. It may have existing consumptions.',
                variant: 'destructive',
            });
        }
    };

    const getTicketNames = (ticketIds: string[]) => {
        return ticketIds
            .map(id => tickets.find(t => t.id === id)?.title || 'Unknown')
            .join(', ');
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-display text-primary glow-text tracking-wider">
                            FOOD COUPONS
                        </h2>
                        <p className="text-muted-foreground font-mono text-sm mt-1">
                            Manage food coupons for participants
                        </p>
                    </div>
                    <button
                        onClick={() => handleOpenForm()}
                        className="flex items-center gap-2 bg-primary text-background px-4 py-2 font-display font-bold rounded hover:scale-105 transition-transform"
                    >
                        <Plus className="w-4 h-4" />
                        New Coupon
                    </button>
                </div>

                {loading ? (
                    <div className="terminal-card p-8 text-center">
                        <div className="text-primary font-mono animate-pulse">Loading coupons...</div>
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="terminal-card p-8 text-center">
                        <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground font-mono">No coupons created yet.</p>
                        <button
                            onClick={() => handleOpenForm()}
                            className="mt-4 text-primary font-mono hover:underline"
                        >
                            Create your first coupon
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {coupons.map((coupon) => (
                            <div
                                key={coupon.id}
                                className={`terminal-card p-4 sm:p-6 ${!coupon.is_active ? 'opacity-60' : ''}`}
                            >
                                <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-display text-primary">
                                                {coupon.name}
                                            </h3>
                                            {!coupon.is_active && (
                                                <span className="text-xs font-mono px-2 py-1 bg-muted-foreground/20 text-muted-foreground rounded">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-1 text-sm font-mono text-muted-foreground">
                                            <p>
                                                <span className="text-primary/70">Quantity:</span>{' '}
                                                {coupon.quantity} per registration
                                            </p>
                                            <p>
                                                <span className="text-primary/70">Tickets:</span>{' '}
                                                {getTicketNames(coupon.ticket_ids || [])}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <button
                                            onClick={() => handleOpenForm(coupon)}
                                            className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(coupon)}
                                            className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
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

                {/* Modal Form */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-card border border-border rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <div className="p-4 border-b border-border flex items-center justify-between">
                                <h3 className="text-lg font-display text-primary">
                                    {editingCoupon ? 'Edit Coupon' : 'New Coupon'}
                                </h3>
                                <button
                                    onClick={handleCloseForm}
                                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-mono text-muted-foreground mb-1">
                                        Coupon Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g., Lunch, Breakfast, Snacks"
                                        className="w-full bg-background border border-border rounded px-3 py-2 text-primary font-mono focus:border-primary"
                                    />
                                </div>

                                {/* Quantity */}
                                <div>
                                    <label className="block text-sm font-mono text-muted-foreground mb-1">
                                        Quantity per Registration
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={formData.quantity}
                                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                        className="w-full bg-background border border-border rounded px-3 py-2 text-primary font-mono focus:border-primary"
                                    />
                                </div>

                                {/* Ticket Selection */}
                                <div>
                                    <label className="block text-sm font-mono text-muted-foreground mb-2">
                                        Applicable Tickets *
                                    </label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded p-2">
                                        {tickets.map((ticket) => (
                                            <label
                                                key={ticket.id}
                                                className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-secondary/30 transition-colors"
                                            >
                                                <div
                                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${formData.ticket_ids.includes(ticket.id)
                                                            ? 'bg-primary border-primary'
                                                            : 'border-border'
                                                        }`}
                                                    onClick={() => handleTicketToggle(ticket.id)}
                                                >
                                                    {formData.ticket_ids.includes(ticket.id) && (
                                                        <Check className="w-3 h-3 text-background" />
                                                    )}
                                                </div>
                                                <span className="text-sm font-mono text-primary">
                                                    {ticket.title}
                                                </span>
                                            </label>
                                        ))}
                                        {tickets.length === 0 && (
                                            <p className="text-sm text-muted-foreground font-mono p-2">
                                                No tickets available.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Active Status */}
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <div
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${formData.is_active
                                                ? 'bg-primary border-primary'
                                                : 'border-border'
                                            }`}
                                        onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                                    >
                                        {formData.is_active && (
                                            <Check className="w-3 h-3 text-background" />
                                        )}
                                    </div>
                                    <span className="text-sm font-mono text-muted-foreground">
                                        Active (can be used for scanning)
                                    </span>
                                </label>

                                {/* Submit */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseForm}
                                        className="flex-1 px-4 py-2 border border-border text-muted-foreground rounded font-mono hover:bg-secondary/50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 bg-primary text-background px-4 py-2 font-display font-bold rounded hover:scale-105 transition-transform disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : editingCoupon ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminCoupons;
