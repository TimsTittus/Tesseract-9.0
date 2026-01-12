import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Ticket, Users, DollarSign } from 'lucide-react';

interface Stats {
    totalTickets: number;
    activeTickets: number;
    totalRegistrations: number;
    pendingRegistrations: number;
}

const AdminDashboard = () => {
    const [stats, setStats] = useState<Stats>({
        totalTickets: 0,
        activeTickets: 0,
        totalRegistrations: 0,
        pendingRegistrations: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [ticketsRes, activeTicketsRes, registrationsRes, pendingRes] = await Promise.all([
                    supabase.from('tickets').select('id', { count: 'exact', head: true }),
                    supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('is_active', true),
                    supabase.from('registrations').select('id', { count: 'exact', head: true }),
                    supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
                ]);

                setStats({
                    totalTickets: ticketsRes.count || 0,
                    activeTickets: activeTicketsRes.count || 0,
                    totalRegistrations: registrationsRes.count || 0,
                    pendingRegistrations: pendingRes.count || 0,
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        { label: 'Total Tickets', value: stats.totalTickets, icon: Ticket, color: 'text-primary' },
        { label: 'Active Tickets', value: stats.activeTickets, icon: Ticket, color: 'text-green-500' },
        { label: 'Total Registrations', value: stats.totalRegistrations, icon: Users, color: 'text-blue-500' },
        { label: 'Pending', value: stats.pendingRegistrations, icon: DollarSign, color: 'text-yellow-500' },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-display text-primary glow-text tracking-wider">
                        DASHBOARD
                    </h2>
                    <p className="text-muted-foreground font-mono text-sm mt-1">
                        Overview of your ticket system
                    </p>
                </div>

                {loading ? (
                    <div className="text-primary font-mono animate-pulse">Loading stats...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {statCards.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={stat.label}
                                    className="terminal-card p-6"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                                                {stat.label}
                                            </p>
                                            <p className={`text-3xl font-display font-bold mt-2 ${stat.color}`}>
                                                {stat.value}
                                            </p>
                                        </div>
                                        <Icon className={`w-8 h-8 ${stat.color} opacity-50`} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="terminal-card p-6">
                    <div className="terminal-header mb-4 -mx-6 -mt-6 px-4">
                        <span className="terminal-dot terminal-dot-red" />
                        <span className="terminal-dot terminal-dot-yellow" />
                        <span className="terminal-dot terminal-dot-green" />
                        <span className="text-xs text-muted-foreground ml-2 font-mono">
                            quick_actions.sh
                        </span>
                    </div>
                    <div className="space-y-2 font-mono text-sm">
                        <p className="text-muted-foreground">
                            <span className="text-primary">&gt;</span> Navigate to{' '}
                            <a href="/admin/tickets" className="text-primary hover:underline">Tickets</a>
                            {' '}to create and manage event tickets
                        </p>
                        <p className="text-muted-foreground">
                            <span className="text-primary">&gt;</span> View{' '}
                            <a href="/admin/registrations" className="text-primary hover:underline">Registrations</a>
                            {' '}to see all user submissions
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
