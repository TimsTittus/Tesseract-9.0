import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { generateTicketDataUrl, type TicketField, type TicketData } from '@/lib/ticketGenerator';
import { Upload, Plus, Trash2, Move, Save, Eye, ArrowLeft } from 'lucide-react';

interface TicketInfo {
    id: string;
    title: string;
}

const FIELD_OPTIONS = [
    { value: 'user_name', label: 'User Name' },
    { value: 'ticket_name', label: 'Ticket/Event Name' },
    { value: 'registration_id', label: 'Registration ID' },
    { value: 'date', label: 'Registration Date' },
];

const FONT_OPTIONS = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Courier New',
    'Verdana',
    'Impact',
];

const AdminTicketTemplate = () => {
    const { ticketId } = useParams<{ ticketId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [ticket, setTicket] = useState<TicketInfo | null>(null);
    const [backgroundUrl, setBackgroundUrl] = useState<string>('');
    const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
    const [fields, setFields] = useState<TicketField[]>([]);
    const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [showPreview, setShowPreview] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Sample data for preview
    const sampleData: TicketData = {
        user_name: 'John Doe',
        ticket_name: ticket?.title || 'Event Name',
        registration_id: 'ABC123XYZ0',
        date: new Date().toLocaleDateString(),
    };

    useEffect(() => {
        fetchTicketAndTemplate();
    }, [ticketId]);

    useEffect(() => {
        drawCanvas();
    }, [backgroundUrl, fields, selectedFieldIndex]);

    const fetchTicketAndTemplate = async () => {
        if (!ticketId) return;

        // Fetch ticket info
        const { data: ticketData, error: ticketError } = await supabase
            .from('tickets')
            .select('id, title')
            .eq('id', ticketId)
            .single();

        if (ticketError) {
            toast({ title: 'Error', description: 'Could not load ticket', variant: 'destructive' });
            navigate('/admin/tickets');
            return;
        }

        setTicket(ticketData);

        // Fetch existing template
        const { data: templateData } = await supabase
            .from('ticket_templates')
            .select('*')
            .eq('ticket_id', ticketId)
            .single();

        if (templateData) {
            setBackgroundUrl(templateData.background_url || '');
            setFields(templateData.fields || []);
        }

        setLoading(false);
    };

    const drawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!backgroundUrl) {
            canvas.width = 800;
            canvas.height = 400;
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#333';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Upload a background image to get started', canvas.width / 2, canvas.height / 2);
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Draw fields
            fields.forEach((field, index) => {
                const isSelected = index === selectedFieldIndex;
                const value = sampleData[field.field] || field.customValue || '[Field]';

                if (field.type === 'text') {
                    ctx.font = `${field.fontSize || 24}px ${field.fontFamily || 'Arial'}`;
                    ctx.fillStyle = field.color || '#000000';
                    ctx.textAlign = field.align || 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillText(value, field.x, field.y);

                    // Draw selection border
                    if (isSelected) {
                        const metrics = ctx.measureText(value);
                        const height = field.fontSize || 24;
                        let x = field.x;
                        if (field.align === 'center') x -= metrics.width / 2;
                        else if (field.align === 'right') x -= metrics.width;

                        ctx.strokeStyle = '#00ff00';
                        ctx.lineWidth = 2;
                        ctx.setLineDash([5, 5]);
                        ctx.strokeRect(x - 5, field.y - 5, metrics.width + 10, height + 10);
                        ctx.setLineDash([]);
                    }
                } else if (field.type === 'qrcode') {
                    const size = field.size || 100;
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(field.x, field.y, size, size);
                    ctx.fillStyle = '#000000';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('QR Code', field.x + size / 2, field.y + size / 2);

                    if (isSelected) {
                        ctx.strokeStyle = '#00ff00';
                        ctx.lineWidth = 2;
                        ctx.setLineDash([5, 5]);
                        ctx.strokeRect(field.x - 5, field.y - 5, size + 10, size + 10);
                        ctx.setLineDash([]);
                    }
                }
            });
        };
        img.src = backgroundUrl;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setBackgroundFile(file);

        // Create temporary URL for preview
        const url = URL.createObjectURL(file);
        setBackgroundUrl(url);
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Check if clicked on a field
        for (let i = fields.length - 1; i >= 0; i--) {
            const field = fields[i];
            const size = field.type === 'qrcode' ? (field.size || 100) : (field.fontSize || 24);
            const width = field.type === 'qrcode' ? size : 200;
            const height = field.type === 'qrcode' ? size : (field.fontSize || 24);

            if (x >= field.x && x <= field.x + width && y >= field.y && y <= field.y + height) {
                setSelectedFieldIndex(i);
                return;
            }
        }
        setSelectedFieldIndex(null);
    };

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (selectedFieldIndex === null) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const field = fields[selectedFieldIndex];
        setDragOffset({ x: x - field.x, y: y - field.y });
        setDragging(true);
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!dragging || selectedFieldIndex === null) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        updateField(selectedFieldIndex, {
            x: Math.max(0, x - dragOffset.x),
            y: Math.max(0, y - dragOffset.y),
        });
    };

    const handleCanvasMouseUp = () => {
        setDragging(false);
    };

    const addField = (type: 'text' | 'qrcode') => {
        const newField: TicketField = {
            type,
            field: type === 'qrcode' ? 'registration_id' : 'user_name',
            x: 50,
            y: 50 + fields.length * 40,
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#000000',
            align: 'left',
            size: 100,
        };
        setFields([...fields, newField]);
        setSelectedFieldIndex(fields.length);
    };

    const updateField = (index: number, updates: Partial<TicketField>) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], ...updates };
        setFields(newFields);
    };

    const removeField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
        setSelectedFieldIndex(null);
    };

    const handlePreview = async () => {
        if (!backgroundUrl || fields.length === 0) {
            toast({ title: 'Error', description: 'Add background and fields first', variant: 'destructive' });
            return;
        }

        try {
            const url = await generateTicketDataUrl(
                { ticket_id: ticketId!, background_url: backgroundUrl, fields },
                sampleData
            );
            setPreviewUrl(url);
            setShowPreview(true);
        } catch (error) {
            toast({ title: 'Error', description: 'Could not generate preview', variant: 'destructive' });
        }
    };

    const handleSave = async () => {
        if (!ticketId) return;

        setSaving(true);

        try {
            let finalBackgroundUrl = backgroundUrl;

            // Upload background if it's a new file
            if (backgroundFile) {
                const fileName = `ticket-templates/${ticketId}-${Date.now()}.${backgroundFile.name.split('.').pop()}`;
                const { error: uploadError } = await supabase.storage
                    .from('tickets')
                    .upload(fileName, backgroundFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('tickets').getPublicUrl(fileName);
                finalBackgroundUrl = urlData.publicUrl;
            }

            // Upsert template
            const { error } = await supabase
                .from('ticket_templates')
                .upsert({
                    ticket_id: ticketId,
                    background_url: finalBackgroundUrl,
                    fields,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'ticket_id' });

            if (error) throw error;

            setBackgroundUrl(finalBackgroundUrl);
            setBackgroundFile(null);
            toast({ title: 'Success', description: 'Template saved successfully!' });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Could not save template';
            toast({ title: 'Error', description: message, variant: 'destructive' });
        }

        setSaving(false);
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="text-primary font-mono animate-pulse">Loading template editor...</div>
            </AdminLayout>
        );
    }

    const selectedField = selectedFieldIndex !== null ? fields[selectedFieldIndex] : null;

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/admin/tickets')}
                            className="p-2 hover:bg-secondary/50 rounded"
                        >
                            <ArrowLeft className="w-5 h-5 text-primary" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-display text-primary glow-text tracking-wider">
                                TICKET TEMPLATE
                            </h2>
                            <p className="text-muted-foreground font-mono text-sm mt-1">
                                {ticket?.title}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePreview}
                            className="flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded font-mono text-sm hover:bg-primary/10"
                        >
                            <Eye className="w-4 h-4" />
                            Preview
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 bg-primary text-background px-4 py-2 font-display font-bold rounded hover:scale-105 transition-transform disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'SAVING...' : 'SAVE'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Canvas Editor */}
                    <div className="lg:col-span-2 terminal-card p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground font-mono">Canvas Editor</span>
                            <div className="flex gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-3 py-1.5 border border-border rounded text-sm font-mono hover:bg-secondary/50"
                                >
                                    <Upload className="w-4 h-4" />
                                    Upload Background
                                </button>
                            </div>
                        </div>
                        <div className="overflow-auto max-h-[600px] border border-border rounded">
                            <canvas
                                ref={canvasRef}
                                onClick={handleCanvasClick}
                                onMouseDown={handleCanvasMouseDown}
                                onMouseMove={handleCanvasMouseMove}
                                onMouseUp={handleCanvasMouseUp}
                                onMouseLeave={handleCanvasMouseUp}
                                className="cursor-crosshair max-w-full"
                                style={{ display: 'block' }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-2">
                            Click to select fields. Drag to reposition. Use the panel on the right to customize.
                        </p>
                    </div>

                    {/* Field Controls */}
                    <div className="space-y-4">
                        {/* Add Field */}
                        <div className="terminal-card p-4">
                            <h3 className="text-sm font-mono text-primary mb-3">Add Fields</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => addField('text')}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-border rounded text-sm font-mono hover:bg-secondary/50"
                                >
                                    <Plus className="w-4 h-4" />
                                    Text
                                </button>
                                <button
                                    onClick={() => addField('qrcode')}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-border rounded text-sm font-mono hover:bg-secondary/50"
                                >
                                    <Plus className="w-4 h-4" />
                                    QR Code
                                </button>
                            </div>
                        </div>

                        {/* Field List */}
                        <div className="terminal-card p-4">
                            <h3 className="text-sm font-mono text-primary mb-3">Fields ({fields.length})</h3>
                            {fields.length === 0 ? (
                                <p className="text-xs text-muted-foreground font-mono">No fields added yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {fields.map((field, index) => (
                                        <div
                                            key={index}
                                            onClick={() => setSelectedFieldIndex(index)}
                                            className={`flex items-center justify-between p-2 rounded cursor-pointer ${index === selectedFieldIndex
                                                    ? 'bg-primary/20 border border-primary'
                                                    : 'bg-secondary/20 border border-transparent hover:border-border'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Move className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-xs font-mono text-primary">
                                                    {field.type === 'qrcode' ? 'QR' : FIELD_OPTIONS.find(o => o.value === field.field)?.label || field.field}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeField(index); }}
                                                className="p-1 text-destructive hover:bg-destructive/10 rounded"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Selected Field Properties */}
                        {selectedField && (
                            <div className="terminal-card p-4">
                                <h3 className="text-sm font-mono text-primary mb-3">Field Properties</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs text-muted-foreground font-mono mb-1">Data Field</label>
                                        <select
                                            value={selectedField.field}
                                            onChange={(e) => updateField(selectedFieldIndex!, { field: e.target.value as TicketField['field'] })}
                                            className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm font-mono text-primary"
                                        >
                                            {FIELD_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs text-muted-foreground font-mono mb-1">X</label>
                                            <input
                                                type="number"
                                                value={Math.round(selectedField.x)}
                                                onChange={(e) => updateField(selectedFieldIndex!, { x: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm font-mono text-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-muted-foreground font-mono mb-1">Y</label>
                                            <input
                                                type="number"
                                                value={Math.round(selectedField.y)}
                                                onChange={(e) => updateField(selectedFieldIndex!, { y: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm font-mono text-primary"
                                            />
                                        </div>
                                    </div>

                                    {selectedField.type === 'text' ? (
                                        <>
                                            <div>
                                                <label className="block text-xs text-muted-foreground font-mono mb-1">Font Family</label>
                                                <select
                                                    value={selectedField.fontFamily || 'Arial'}
                                                    onChange={(e) => updateField(selectedFieldIndex!, { fontFamily: e.target.value })}
                                                    className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm font-mono text-primary"
                                                >
                                                    {FONT_OPTIONS.map(font => (
                                                        <option key={font} value={font}>{font}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-xs text-muted-foreground font-mono mb-1">Size</label>
                                                    <input
                                                        type="number"
                                                        value={selectedField.fontSize || 24}
                                                        onChange={(e) => updateField(selectedFieldIndex!, { fontSize: parseInt(e.target.value) || 24 })}
                                                        className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm font-mono text-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-muted-foreground font-mono mb-1">Color</label>
                                                    <input
                                                        type="color"
                                                        value={selectedField.color || '#000000'}
                                                        onChange={(e) => updateField(selectedFieldIndex!, { color: e.target.value })}
                                                        className="w-full h-8 bg-background border border-border rounded cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-muted-foreground font-mono mb-1">Align</label>
                                                <div className="flex gap-1">
                                                    {(['left', 'center', 'right'] as const).map(align => (
                                                        <button
                                                            key={align}
                                                            onClick={() => updateField(selectedFieldIndex!, { align })}
                                                            className={`flex-1 py-1.5 text-xs font-mono rounded ${selectedField.align === align
                                                                    ? 'bg-primary text-background'
                                                                    : 'bg-secondary/50 text-primary hover:bg-secondary'
                                                                }`}
                                                        >
                                                            {align.charAt(0).toUpperCase() + align.slice(1)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div>
                                            <label className="block text-xs text-muted-foreground font-mono mb-1">QR Size</label>
                                            <input
                                                type="number"
                                                value={selectedField.size || 100}
                                                onChange={(e) => updateField(selectedFieldIndex!, { size: parseInt(e.target.value) || 100 })}
                                                className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm font-mono text-primary"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && previewUrl && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
                    <div className="max-w-4xl max-h-[90vh] overflow-auto">
                        <img src={previewUrl} alt="Ticket Preview" className="max-w-full h-auto" />
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminTicketTemplate;
