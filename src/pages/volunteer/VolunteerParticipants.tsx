import { useState, useEffect } from 'react';
import { VolunteerLayout } from '@/components/volunteer/VolunteerLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Search, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface Participant {
    id: string;
    registration_id: string;
    checked_in: boolean;
    checked_in_at: string | null;
    created_at: string;
    profile: {
        full_name: string;
        email: string;
        phone: string;
    };
    ticket: {
        title: string;
    };
}

const VolunteerParticipants = () => {
    const { toast } = useToast();
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchParticipants = async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from('registrations')
            .select('id, registration_id, checked_in, checked_in_at, created_at, profile:profiles!fk_registrations_profile(full_name, email, phone), ticket:tickets(title)')
            .eq('status', 'confirmed')
            .order('checked_in', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) {
            toast({
                title: 'Error',
                description: 'Failed to load participants',
                variant: 'destructive',
            });
        } else {
            setParticipants(data as unknown as Participant[]);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchParticipants();
    }, []);

    const filteredParticipants = participants.filter((p) => {
        const query = searchQuery.toLowerCase();
        return (
            p.profile.full_name.toLowerCase().includes(query) ||
            p.profile.email.toLowerCase().includes(query) ||
            p.profile.phone.includes(query) ||
            p.registration_id.toLowerCase().includes(query) ||
            p.ticket.title.toLowerCase().includes(query)
        );
    });

    const checkedInCount = participants.filter(p => p.checked_in).length;
    const totalCount = participants.length;

    return (
        <VolunteerLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-display text-primary glow-text tracking-wider">
                            PARTICIPANTS
                        </h2>
                        <p className="text-muted-foreground font-mono text-sm mt-1">
                            All confirmed registrations and check-in status
                        </p>
                    </div>
                    <button
                        onClick={fetchParticipants}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-primary text-primary rounded font-mono text-sm hover:bg-primary/10 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="terminal-card p-4 text-center">
                        <p className="text-2xl font-display font-bold text-primary">{totalCount}</p>
                        <p className="text-xs text-muted-foreground font-mono">Total Confirmed</p>
                    </div>
                    <div className="terminal-card p-4 text-center">
                        <p className="text-2xl font-display font-bold text-green-500">{checkedInCount}</p>
                        <p className="text-xs text-muted-foreground font-mono">Checked In</p>
                    </div>
                    <div className="terminal-card p-4 text-center hidden sm:block">
                        <p className="text-2xl font-display font-bold text-yellow-500">{totalCount - checkedInCount}</p>
                        <p className="text-xs text-muted-foreground font-mono">Pending</p>
                    </div>
                </div>

                {/* Search */}
                <div className="terminal-card p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email, phone, ticket..."
                            className="w-full bg-background border border-border rounded pl-10 pr-4 py-2 text-sm text-primary font-mono focus:border-primary"
                        />
                    </div>
                </div>

                {/* Participants List */}
                {loading ? (
                    <div className="text-primary font-mono animate-pulse">Loading participants...</div>
                ) : filteredParticipants.length === 0 ? (
                    <div className="terminal-card p-8 text-center">
                        <p className="text-muted-foreground font-mono">No participants found.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredParticipants.map((participant) => (
                            <div
                                key={participant.id}
                                className={`terminal-card p-4 ${participant.checked_in ? 'border-green-500/30' : ''}`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h3 className="font-display text-primary">
                                                {participant.profile.full_name}
                                            </h3>
                                            {participant.checked_in ? (
                                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-mono bg-green-500/20 text-green-500">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Checked In
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-mono bg-yellow-500/20 text-yellow-500">
                                                    <Clock className="w-3 h-3" />
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground font-mono">
                                            {participant.profile.phone} • {participant.ticket.title}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-primary bg-primary/10 px-2 py-1 rounded font-mono tracking-wider">
                                            {participant.registration_id}
                                        </p>
                                        {participant.checked_in && participant.checked_in_at && (
                                            <p className="text-xs text-muted-foreground font-mono mt-1">
                                                {new Date(participant.checked_in_at).toLocaleTimeString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </VolunteerLayout>
    );
};

export default VolunteerParticipants;
