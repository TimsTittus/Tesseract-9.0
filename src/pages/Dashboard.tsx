import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { PhoneDialog } from '@/components/PhoneDialog';
import { LogOut, User, Phone, Mail, Ticket, Settings, Share2, Copy, Check, Download, Eye, X, QrCode } from 'lucide-react';
import { generateTicketDataUrl, downloadBlob, generateTicketImage, type TicketTemplate, type TicketData } from '@/lib/ticketGenerator';
import { useToast } from '@/hooks/use-toast';
import type { Ticket as TicketType, Registration } from '@/types';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, profile, loading, signOut, isAdmin, isVolunteer } = useAuth();
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [ticketPreview, setTicketPreview] = useState<string | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [currentTicketData, setCurrentTicketData] = useState<{ template: TicketTemplate, data: TicketData } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile && !profile.phone) {
      setShowPhoneDialog(true);
    }
  }, [profile]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const [ticketsRes, registrationsRes] = await Promise.all([
        supabase.from('tickets').select('*').eq('is_active', true),
        supabase
          .from('registrations')
          .select('*, ticket:tickets(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (!ticketsRes.error) setTickets(ticketsRes.data || []);
      if (!registrationsRes.error) setRegistrations(registrationsRes.data || []);
      setDataLoading(false);
    };

    if (user) fetchData();
  }, [user]);

  // Fetch referral count - runs on every navigation to dashboard
  useEffect(() => {
    const fetchReferralCount = async () => {
      if (!profile?.referral_code) return;

      const { count } = await supabase
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', profile.referral_code);

      setReferralCount(count || 0);
    };

    fetchReferralCount();
  }, [profile?.referral_code, location.key]);

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handlePhoneComplete = () => {
    setShowPhoneDialog(false);
  };

  const handleViewTicket = async (reg: Registration) => {
    if (!reg.registration_id || !reg.ticket_id) return;

    setTicketLoading(true);

    try {
      // Fetch ticket template
      const { data: template, error } = await supabase
        .from('ticket_templates')
        .select('*')
        .eq('ticket_id', reg.ticket_id)
        .single();

      if (error || !template) {
        toast({
          title: 'No Template',
          description: 'No ticket template has been created for this event yet.',
          variant: 'destructive',
        });
        setTicketLoading(false);
        return;
      }

      const ticketData: TicketData = {
        user_name: profile?.full_name || 'User',
        ticket_name: reg.ticket?.title || 'Event',
        registration_id: reg.registration_id,
        date: new Date(reg.created_at).toLocaleDateString(),
      };

      const previewUrl = await generateTicketDataUrl(template, ticketData);
      setTicketPreview(previewUrl);
      setCurrentTicketData({ template, data: ticketData });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Could not generate ticket. Please try again.',
        variant: 'destructive',
      });
    }

    setTicketLoading(false);
  };

  const handleDownloadTicket = async () => {
    if (!currentTicketData) return;

    try {
      const blob = await generateTicketImage(currentTicketData.template, currentTicketData.data);
      downloadBlob(blob, `ticket-${currentTicketData.data.registration_id}.png`);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Could not download ticket.',
        variant: 'destructive',
      });
    }
  };

  const closeTicketPreview = () => {
    if (ticketPreview) {
      URL.revokeObjectURL(ticketPreview);
    }
    setTicketPreview(null);
    setCurrentTicketData(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary font-mono animate-pulse">LOADING...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative scanlines flex flex-col">
      <Navigation />

      <main className="flex-1 p-4 pt-20">
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-primary glow-text text-center tracking-wider">
            DASHBOARD
          </h1>

          {/* Admin Link */}
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center justify-center gap-2 bg-secondary/30 border border-primary/30 py-3 rounded font-mono text-primary hover:bg-secondary/50 hover:border-primary transition-colors"
            >
              <Settings className="w-5 h-5" />
              ADMIN PANEL
            </Link>
          )}

          {/* Volunteer Link */}
          {(isVolunteer || isAdmin) && (
            <Link
              to="/volunteer"
              className="flex items-center justify-center gap-2 bg-secondary/30 border border-green-500/30 py-3 rounded font-mono text-green-400 hover:bg-secondary/50 hover:border-green-500 transition-colors"
            >
              <QrCode className="w-5 h-5" />
              VOLUNTEER PANEL
            </Link>
          )}

          {/* Profile Card */}
          <div className="terminal-card">
            <div className="terminal-header">
              <span className="terminal-dot terminal-dot-red" />
              <span className="terminal-dot terminal-dot-yellow" />
              <span className="terminal-dot terminal-dot-green" />
              <span className="text-xs text-muted-foreground ml-2 font-mono">
                user://profile
              </span>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-display text-primary break-words">
                      {profile?.full_name || 'User'}
                    </h2>
                    <p className="text-sm text-muted-foreground font-mono">Welcome back</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-destructive/50 bg-destructive/10 rounded font-mono text-sm text-destructive hover:bg-destructive/20 shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                  SIGN OUT
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-background border border-border rounded">
                  <Mail className="w-4 h-4 text-primary/60" />
                  <div className="min-w-0">
                    <span className="text-xs text-muted-foreground font-mono block">EMAIL</span>
                    <span className="text-sm text-primary font-mono truncate block">{profile?.email || user.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background border border-border rounded">
                  <Phone className="w-4 h-4 text-primary/60" />
                  <div className="min-w-0">
                    <span className="text-xs text-muted-foreground font-mono block">PHONE</span>
                    <span className="text-sm text-primary font-mono truncate block">{profile?.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Available Tickets */}
          <div className="terminal-card">
            <div className="terminal-header">
              <span className="terminal-dot terminal-dot-red" />
              <span className="terminal-dot terminal-dot-yellow" />
              <span className="terminal-dot terminal-dot-green" />
              <span className="text-xs text-muted-foreground ml-2 font-mono">
                tickets://available
              </span>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-display text-primary mb-4">AVAILABLE TICKETS</h3>

              {dataLoading ? (
                <div className="text-muted-foreground font-mono text-sm animate-pulse">Loading...</div>
              ) : tickets.length === 0 ? (
                <p className="text-muted-foreground font-mono text-sm">No tickets available at the moment.</p>
              ) : (
                <div className="grid gap-3">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 bg-background border border-border rounded hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <Ticket className="w-5 h-5 text-primary/60 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-display text-primary">{ticket.title}</h4>
                          {ticket.description && (
                            <p className="text-xs text-muted-foreground font-mono mt-1">{ticket.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-display font-bold">
                          {ticket.price > 0 ? `₹${ticket.price}` : 'FREE'}
                        </span>
                        <Link
                          to={`/tickets/${ticket.id}/register`}
                          className="bg-primary text-background px-4 py-2 font-display font-bold text-sm rounded hover:scale-105 transition-transform"
                        >
                          REGISTER
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* My Registrations */}
          <div className="terminal-card">
            <div className="terminal-header">
              <span className="terminal-dot terminal-dot-red" />
              <span className="terminal-dot terminal-dot-yellow" />
              <span className="terminal-dot terminal-dot-green" />
              <span className="text-xs text-muted-foreground ml-2 font-mono">
                registrations://mine
              </span>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-display text-primary mb-4">MY REGISTRATIONS</h3>

              {dataLoading ? (
                <div className="text-muted-foreground font-mono text-sm animate-pulse">Loading...</div>
              ) : registrations.length === 0 ? (
                <p className="text-muted-foreground font-mono text-sm">You haven't registered for any events yet.</p>
              ) : (
                <div className="space-y-3">
                  {registrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="p-4 bg-background border border-border rounded"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-display text-primary">{reg.ticket?.title || 'Unknown'}</h4>
                        <span
                          className={`text-xs px-2 py-1 rounded font-mono ${reg.status === 'confirmed'
                            ? 'bg-green-500/20 text-green-500'
                            : reg.status === 'cancelled'
                              ? 'bg-red-500/20 text-red-500'
                              : 'bg-yellow-500/20 text-yellow-500'
                            }`}
                        >
                          {reg.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                        <span>{new Date(reg.created_at).toLocaleDateString()}</span>
                        {reg.registration_id && (
                          <span className="text-primary bg-primary/10 px-2 py-0.5 rounded tracking-wider">
                            ID: {reg.registration_id}
                          </span>
                        )}
                      </div>
                      {reg.status === 'confirmed' && reg.registration_id && (
                        <button
                          onClick={() => handleViewTicket(reg)}
                          disabled={ticketLoading}
                          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 border border-primary text-primary rounded font-mono text-sm hover:bg-primary/10 disabled:opacity-50"
                        >
                          <Eye className="w-4 h-4" />
                          {ticketLoading ? 'Loading...' : 'View Ticket'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Referrals Section */}
          <div className="terminal-card">
            <div className="terminal-header">
              <span className="terminal-dot terminal-dot-red" />
              <span className="terminal-dot terminal-dot-yellow" />
              <span className="terminal-dot terminal-dot-green" />
              <span className="text-xs text-muted-foreground ml-2 font-mono">
                referrals://code
              </span>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-display text-primary">YOUR REFERRAL CODE</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-background border border-border rounded">
                  <span className="text-xs text-muted-foreground font-mono block mb-2">REFERRAL CODE</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-display font-bold text-primary tracking-widest">
                      {profile?.referral_code || '-----'}
                    </span>
                    <button
                      onClick={copyReferralCode}
                      className="p-2 hover:bg-secondary/50 rounded transition-colors"
                      title="Copy code"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-background border border-border rounded">
                  <span className="text-xs text-muted-foreground font-mono block mb-2">TOTAL REFERRALS</span>
                  <span className="text-2xl font-display font-bold text-primary">
                    {referralCount}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground font-mono mt-4">
                Share your referral code with friends. When they use it during registration, you'll see them in your referral count!
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Ticket Preview Modal */}
      {ticketPreview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] overflow-auto">
            <button
              onClick={closeTicketPreview}
              className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={ticketPreview} alt="Your Ticket" className="max-w-full h-auto" />
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={handleDownloadTicket}
                className="flex items-center gap-2 bg-primary text-background px-6 py-3 font-display font-bold rounded hover:scale-105 transition-transform"
              >
                <Download className="w-5 h-5" />
                Download Ticket
              </button>
              <button
                onClick={closeTicketPreview}
                className="flex items-center gap-2 border border-white text-white px-6 py-3 font-mono rounded hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <PhoneDialog open={showPhoneDialog} onComplete={handlePhoneComplete} />
    </div>
  );
};

export default Dashboard;
