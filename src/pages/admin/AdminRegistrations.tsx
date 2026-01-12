import { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { Registration, Ticket, FormField } from '@/types';
import { Download, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface RegistrationWithDetails extends Registration {
    ticket: Ticket;
    profile: {
        full_name: string;
        email: string;
        phone: string;
    };
}

// Helper to get college from form_data (looks for any field with 'college' in label)
const getCollegeFromFormData = (reg: RegistrationWithDetails): string => {
    if (!reg.form_data || !reg.ticket?.form_fields) return '';

    // Find field with 'college' in label
    const collegeField = reg.ticket.form_fields.find(
        (f: FormField) => f.label.toLowerCase().includes('college')
    );

    if (collegeField && reg.form_data[collegeField.id]) {
        return String(reg.form_data[collegeField.id]);
    }
    return '';
};

type SortField = 'created_at' | 'profile.full_name' | 'profile.email' | 'college' | 'ticket.title' | 'status';
type SortDirection = 'asc' | 'desc';

const AdminRegistrations = () => {
    const { toast } = useToast();
    const [registrations, setRegistrations] = useState<RegistrationWithDetails[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Sorting
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Filtering
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTicket, setFilterTicket] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    const fetchData = async () => {
        const [registrationsRes, ticketsRes] = await Promise.all([
            supabase
                .from('registrations')
                .select('*, ticket:tickets(*), profile:profiles!fk_registrations_profile(full_name, email, phone)')
                .order('created_at', { ascending: false }),
            supabase.from('tickets').select('*'),
        ]);

        if (registrationsRes.error) {
            toast({ title: 'Error', description: registrationsRes.error.message, variant: 'destructive' });
        } else {
            setRegistrations(registrationsRes.data || []);
        }

        if (!ticketsRes.error) {
            setTickets(ticketsRes.data || []);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleRowExpand = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Helper to get field label from ticket form_fields
    const getFieldLabel = (ticket: Ticket | undefined, fieldId: string): string => {
        if (!ticket?.form_fields) return fieldId;
        const field = ticket.form_fields.find((f: FormField) => f.id === fieldId);
        return field?.label || fieldId;
    };

    const getSortValue = (reg: RegistrationWithDetails, field: SortField): string | number => {
        switch (field) {
            case 'profile.full_name':
                return reg.profile?.full_name || '';
            case 'profile.email':
                return reg.profile?.email || '';
            case 'college':
                return getCollegeFromFormData(reg);
            case 'ticket.title':
                return reg.ticket?.title || '';
            case 'status':
                return reg.status;
            case 'created_at':
            default:
                return new Date(reg.created_at).getTime();
        }
    };

    const filteredAndSortedRegistrations = useMemo(() => {
        let result = [...registrations];

        // Apply filters
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (reg) =>
                    reg.profile?.full_name?.toLowerCase().includes(query) ||
                    reg.profile?.email?.toLowerCase().includes(query) ||
                    reg.profile?.phone?.includes(query) ||
                    getCollegeFromFormData(reg).toLowerCase().includes(query) ||
                    reg.ticket?.title?.toLowerCase().includes(query)
            );
        }

        if (filterTicket) {
            result = result.filter((reg) => reg.ticket_id === filterTicket);
        }

        if (filterStatus) {
            result = result.filter((reg) => reg.status === filterStatus);
        }

        // Apply sorting
        result.sort((a, b) => {
            const aVal = getSortValue(a, sortField);
            const bVal = getSortValue(b, sortField);

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            return sortDirection === 'asc'
                ? (aVal as number) - (bVal as number)
                : (bVal as number) - (aVal as number);
        });

        return result;
    }, [registrations, searchQuery, filterTicket, filterStatus, sortField, sortDirection]);

    const exportToCSV = () => {
        if (filteredAndSortedRegistrations.length === 0) {
            toast({ title: 'No Data', description: 'No registrations to export', variant: 'destructive' });
            return;
        }

        // Build headers
        const baseHeaders = ['Name', 'Email', 'Phone', 'College', 'Ticket', 'Status', 'Check-in', 'Referred By', 'Date'];

        // Get all unique form field keys and their labels
        const formFieldMap = new Map<string, string>();
        filteredAndSortedRegistrations.forEach((reg) => {
            Object.keys(reg.form_data || {}).forEach((key) => {
                if (!formFieldMap.has(key)) {
                    formFieldMap.set(key, getFieldLabel(reg.ticket, key));
                }
            });
        });
        const allHeaders = [...baseHeaders, ...Array.from(formFieldMap.values())];

        // Build rows
        const formFieldKeys = Array.from(formFieldMap.keys());
        const rows = filteredAndSortedRegistrations.map((reg) => {
            const baseRow = [
                reg.profile?.full_name || '',
                reg.profile?.email || '',
                reg.profile?.phone || '',
                getCollegeFromFormData(reg),
                reg.ticket?.title || '',
                reg.status,
                reg.checked_in ? 'Yes' : 'No',
                reg.referred_by || '',
                new Date(reg.created_at).toLocaleDateString(),
            ];

            const formRow = formFieldKeys.map((key) => {
                const value = reg.form_data?.[key];
                return typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
            });

            return [...baseRow, ...formRow];
        });

        // Create CSV
        const csvContent = [
            allHeaders.join(','),
            ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
        ].join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `registrations_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        toast({ title: 'Exported', description: `${filteredAndSortedRegistrations.length} registrations exported` });
    };

    const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
        <th
            onClick={() => handleSort(field)}
            className="px-4 py-3 text-left text-xs font-mono text-primary/80 uppercase tracking-wider cursor-pointer hover:text-primary"
        >
            <div className="flex items-center gap-1">
                {label}
                {sortField === field && (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
            </div>
        </th>
    );

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-display text-primary glow-text tracking-wider">
                            REGISTRATIONS
                        </h2>
                        <p className="text-muted-foreground font-mono text-sm mt-1">
                            View and export all user registrations
                        </p>
                    </div>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center justify-center gap-2 bg-primary text-background px-4 py-2 font-display font-bold rounded hover:scale-105 transition-transform"
                    >
                        <Download className="w-4 h-4" />
                        EXPORT CSV
                    </button>
                </div>

                {/* Filters */}
                <div className="terminal-card p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name, email, phone..."
                                    className="w-full bg-background border border-border rounded pl-10 pr-4 py-2 text-sm text-primary font-mono focus:border-primary"
                                />
                            </div>
                        </div>
                        <select
                            value={filterTicket}
                            onChange={(e) => setFilterTicket(e.target.value)}
                            className="bg-background border border-border rounded px-4 py-2 text-sm text-primary font-mono focus:border-primary"
                        >
                            <option value="">All Tickets</option>
                            {tickets.map((t) => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-background border border-border rounded px-4 py-2 text-sm text-primary font-mono focus:border-primary"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="text-primary font-mono animate-pulse">Loading registrations...</div>
                ) : filteredAndSortedRegistrations.length === 0 ? (
                    <div className="terminal-card p-8 text-center">
                        <p className="text-muted-foreground font-mono">No registrations found.</p>
                    </div>
                ) : (
                    <div className="terminal-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-secondary/30 border-b border-border">
                                    <tr>
                                        <th className="w-10"></th>
                                        <th className="px-4 py-3 text-left text-xs font-mono text-primary/80 uppercase tracking-wider">Reg ID</th>
                                        <SortHeader field="profile.full_name" label="Name" />
                                        <SortHeader field="profile.email" label="Email" />
                                        <th className="px-4 py-3 text-left text-xs font-mono text-primary/80 uppercase tracking-wider">Phone</th>
                                        <SortHeader field="college" label="College" />
                                        <SortHeader field="ticket.title" label="Ticket" />
                                        <SortHeader field="status" label="Status" />
                                        <th className="px-4 py-3 text-left text-xs font-mono text-primary/80 uppercase tracking-wider">Check-in</th>
                                        <SortHeader field="created_at" label="Date" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredAndSortedRegistrations.map((reg) => (
                                        <>
                                            <tr
                                                key={reg.id}
                                                className="hover:bg-secondary/20 cursor-pointer"
                                                onClick={() => toggleRowExpand(reg.id)}
                                            >
                                                <td className="px-4 py-3">
                                                    {Object.keys(reg.form_data || {}).length > 0 && (
                                                        expandedRows.has(reg.id) ? (
                                                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                        )
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono text-primary">
                                                    {reg.registration_id || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono text-primary">
                                                    {reg.profile?.full_name || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                                                    {reg.profile?.email || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                                                    {reg.profile?.phone || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                                                    {getCollegeFromFormData(reg) || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono text-primary">
                                                    {reg.ticket?.title || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`text-xs px-2 py-0.5 rounded font-mono ${reg.status === 'confirmed'
                                                            ? 'bg-green-500/20 text-green-500'
                                                            : reg.status === 'cancelled'
                                                                ? 'bg-red-500/20 text-red-500'
                                                                : 'bg-yellow-500/20 text-yellow-500'
                                                            }`}
                                                    >
                                                        {reg.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {reg.checked_in ? (
                                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-mono bg-green-500/20 text-green-500">
                                                            ✓ CHECKED IN
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs px-2 py-0.5 rounded font-mono bg-secondary/30 text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                                                    {new Date(reg.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                            {expandedRows.has(reg.id) && (
                                                <tr key={`${reg.id}-details`}>
                                                    <td colSpan={10} className="px-4 py-4 bg-secondary/10">
                                                        <div className="space-y-4">
                                                            {/* Referred By Section */}
                                                            {reg.referred_by && (
                                                                <div>
                                                                    <div className="text-xs font-mono text-muted-foreground mb-2">
                                                                        REFERRED BY
                                                                    </div>
                                                                    <div className="bg-background p-2 rounded border border-border inline-block">
                                                                        <span className="text-sm text-primary font-mono">{reg.referred_by}</span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Check-in Details */}
                                                            {reg.checked_in && reg.checked_in_at && (
                                                                <div>
                                                                    <div className="text-xs font-mono text-muted-foreground mb-2">
                                                                        CHECK-IN DETAILS
                                                                    </div>
                                                                    <div className="bg-background p-2 rounded border border-green-500/30 inline-block">
                                                                        <span className="text-sm text-green-500 font-mono">
                                                                            Checked in at {new Date(reg.checked_in_at).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Custom Form Data */}
                                                            {Object.keys(reg.form_data || {}).length > 0 && (
                                                                <div>
                                                                    <div className="text-xs font-mono text-muted-foreground mb-2">
                                                                        CUSTOM FORM DATA
                                                                    </div>
                                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                                        {Object.entries(reg.form_data || {}).map(([key, value]) => (
                                                                            <div key={key} className="bg-background p-2 rounded border border-border">
                                                                                <span className="text-xs text-muted-foreground block">{getFieldLabel(reg.ticket, key)}</span>
                                                                                <span className="text-sm text-primary font-mono">
                                                                                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="text-sm text-muted-foreground font-mono">
                    Showing {filteredAndSortedRegistrations.length} of {registrations.length} registrations
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminRegistrations;
