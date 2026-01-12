import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';

interface ReferralUser {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    referral_code: string;
    referral_count: number;
}

interface ReferredPerson {
    id: string;
    full_name: string;
    phone: string;
    ticket_title: string;
    created_at: string;
}

const AdminReferrals = () => {
    const { toast } = useToast();
    const [referralUsers, setReferralUsers] = useState<ReferralUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [referredPeople, setReferredPeople] = useState<Record<string, ReferredPerson[]>>({});
    const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchReferralUsers();
    }, []);

    const fetchReferralUsers = async () => {
        try {
            // Get all profiles with referral codes
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, email, phone, referral_code')
                .not('referral_code', 'is', null);

            if (profilesError) {
                toast({ title: 'Error', description: profilesError.message, variant: 'destructive' });
                setLoading(false);
                return;
            }

            // Get all registrations with referral codes and count them
            const { data: registrations, error: regError } = await supabase
                .from('registrations')
                .select('referred_by')
                .not('referred_by', 'is', null);

            if (regError) {
                toast({ title: 'Error', description: regError.message, variant: 'destructive' });
                setLoading(false);
                return;
            }

            // Count referrals per code
            const referralCounts: Record<string, number> = {};
            (registrations || []).forEach((reg) => {
                if (reg.referred_by) {
                    referralCounts[reg.referred_by] = (referralCounts[reg.referred_by] || 0) + 1;
                }
            });

            // Create user list with referral counts >= 1
            const usersWithReferrals = (profiles || [])
                .map((profile) => ({
                    ...profile,
                    referral_count: referralCounts[profile.referral_code] || 0,
                }))
                .filter((user) => user.referral_count >= 1)
                .sort((a, b) => b.referral_count - a.referral_count);

            setReferralUsers(usersWithReferrals);
        } catch (error) {
            console.error('Fetch error:', error);
            toast({ title: 'Error', description: 'Failed to load referral data', variant: 'destructive' });
        }

        setLoading(false);
    };

    const toggleRow = async (userId: string, referralCode: string) => {
        const newExpanded = new Set(expandedRows);

        if (newExpanded.has(userId)) {
            newExpanded.delete(userId);
            setExpandedRows(newExpanded);
            return;
        }

        // Fetch referred people if not already loaded
        if (!referredPeople[userId]) {
            setLoadingDetails((prev) => new Set([...prev, userId]));

            const { data, error } = await supabase
                .from('registrations')
                .select('id, created_at, user_id, ticket:tickets(title), profile:profiles!fk_registrations_profile(full_name, phone)')
                .eq('referred_by', referralCode);

            if (error) {
                toast({ title: 'Error', description: error.message, variant: 'destructive' });
            } else {
                const people: ReferredPerson[] = (data || []).map((reg: any) => ({
                    id: reg.id,
                    full_name: reg.profile?.full_name || 'Unknown',
                    phone: reg.profile?.phone || '-',
                    ticket_title: reg.ticket?.title || 'Unknown',
                    created_at: reg.created_at,
                }));

                setReferredPeople((prev) => ({ ...prev, [userId]: people }));
            }

            setLoadingDetails((prev) => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        }

        newExpanded.add(userId);
        setExpandedRows(newExpanded);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-display text-primary glow-text tracking-wider">
                        REFERRALS
                    </h2>
                    <p className="text-muted-foreground font-mono text-sm mt-1">
                        Users with successful referrals
                    </p>
                </div>

                {loading ? (
                    <div className="text-primary font-mono animate-pulse">Loading referrals...</div>
                ) : referralUsers.length === 0 ? (
                    <div className="terminal-card p-8 text-center">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground font-mono">No users with referrals yet.</p>
                    </div>
                ) : (
                    <div className="terminal-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-secondary/30 border-b border-border">
                                    <tr>
                                        <th className="w-10"></th>
                                        <th className="px-4 py-3 text-left text-xs font-mono text-primary/80 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-mono text-primary/80 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-mono text-primary/80 uppercase tracking-wider">
                                            Phone
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-mono text-primary/80 uppercase tracking-wider">
                                            Referral Code
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-mono text-primary/80 uppercase tracking-wider">
                                            Referrals
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {referralUsers.map((user) => (
                                        <>
                                            <tr
                                                key={user.id}
                                                className="hover:bg-secondary/20 cursor-pointer"
                                                onClick={() => toggleRow(user.id, user.referral_code)}
                                            >
                                                <td className="px-4 py-3">
                                                    {expandedRows.has(user.id) ? (
                                                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono text-primary">
                                                    {user.full_name || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                                                    {user.email}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                                                    {user.phone || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-1 rounded tracking-widest">
                                                        {user.referral_code}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-display font-bold text-primary">
                                                        {user.referral_count}
                                                    </span>
                                                </td>
                                            </tr>
                                            {expandedRows.has(user.id) && (
                                                <tr key={`${user.id}-details`}>
                                                    <td colSpan={6} className="px-4 py-4 bg-secondary/10">
                                                        {loadingDetails.has(user.id) ? (
                                                            <div className="text-muted-foreground font-mono text-sm animate-pulse">
                                                                Loading referred users...
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <div className="text-xs font-mono text-muted-foreground mb-3">
                                                                    REFERRED USERS
                                                                </div>
                                                                <div className="grid gap-2">
                                                                    {(referredPeople[user.id] || []).map((person) => (
                                                                        <div
                                                                            key={person.id}
                                                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-background border border-border rounded gap-2"
                                                                        >
                                                                            <div>
                                                                                <span className="text-sm font-mono text-primary">
                                                                                    {person.full_name}
                                                                                </span>
                                                                                <span className="text-xs text-muted-foreground ml-3">
                                                                                    {person.phone}
                                                                                </span>
                                                                            </div>
                                                                            <div className="sm:text-right">
                                                                                <span className="text-xs text-muted-foreground font-mono">
                                                                                    {person.ticket_title}
                                                                                </span>
                                                                                <span className="text-xs text-muted-foreground ml-3">
                                                                                    {new Date(person.created_at).toLocaleDateString()}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
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
                    Showing {referralUsers.length} users with referrals
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminReferrals;
