import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import type { Ticket, FormField } from '@/types';

// Environment variables
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Extend Window interface for Razorpay
declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    order_id: string;
    name: string;
    description: string;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    handler: (response: RazorpayResponse) => void;
    theme?: { color: string };
    modal?: { ondismiss: () => void };
}

interface RazorpayInstance {
    open: () => void;
    on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
}

interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

const TicketRegistration = () => {
    const { ticketId } = useParams<{ ticketId: string }>();
    const navigate = useNavigate();
    const { user, profile, session, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<Record<string, unknown>>({});
    const [referralCode, setReferralCode] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
            return;
        }

        const fetchTicket = async () => {
            if (!ticketId) return;

            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('id', ticketId)
                .eq('is_active', true)
                .single();

            if (error || !data) {
                toast({ title: 'Error', description: 'Ticket not found or unavailable', variant: 'destructive' });
                navigate('/dashboard');
                return;
            }

            setTicket(data);

            // Initialize form data with empty values
            const initialData: Record<string, unknown> = {};
            (data.form_fields || []).forEach((field: FormField) => {
                initialData[field.id] = field.type === 'checkbox' ? false : '';
            });
            setFormData(initialData);
            setLoading(false);
        };

        if (!authLoading) {
            fetchTicket();
        }
    }, [ticketId, user, authLoading, navigate, toast]);

    const handleInputChange = (fieldId: string, value: unknown) => {
        setFormData((prev) => ({ ...prev, [fieldId]: value }));
    };

    // Generate 10-digit alphanumeric registration ID
    const generateRegistrationId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 10; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    // Load Razorpay SDK dynamically
    const loadRazorpay = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // Handle payment flow
    const handlePayment = async (registrationId: string, registrationUUID: string) => {
        if (!ticket || !user) return;

        try {
            // Load Razorpay SDK
            const loaded = await loadRazorpay();
            if (!loaded) {
                throw new Error('Failed to load payment gateway');
            }

            // Get current session token for Edge Function auth
            const accessToken = session?.access_token;
            if (!accessToken) {
                throw new Error('No valid session. Please log in again.');
            }

            // Create order via Edge Function
            const orderRes = await fetch(`${SUPABASE_URL}/functions/v1/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'apikey': SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({
                    amount: ticket.price,
                    user_id: user.id,
                    registration_id: registrationUUID,
                }),
            });

            const orderData = await orderRes.json();
            if (!orderData.success) {
                throw new Error(orderData.error || 'Failed to create order');
            }

            // Open Razorpay checkout
            const options: RazorpayOptions = {
                key: RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                order_id: orderData.order_id,
                name: 'TESSERACT 9.0',
                description: `Registration for ${ticket.title}`,
                prefill: {
                    name: profile?.full_name || '',
                    email: profile?.email || '',
                    contact: profile?.phone || '',
                },
                handler: async (response: RazorpayResponse) => {
                    try {
                        // Verify payment via Edge Function
                        const verifyRes = await fetch(`${SUPABASE_URL}/functions/v1/verify-payment`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${accessToken}`,
                                'apikey': SUPABASE_ANON_KEY,
                            },
                            body: JSON.stringify({
                                razorpay_order_id: orderData.order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                registration_id: registrationUUID,
                            }),
                        });

                        const verifyData = await verifyRes.json();
                        if (!verifyData.success) {
                            throw new Error(verifyData.error || 'Payment verification failed');
                        }

                        toast({
                            title: 'Payment Successful!',
                            description: `Your registration ID is ${registrationId}`,
                        });
                        navigate('/dashboard');
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        toast({
                            title: 'Verification Error',
                            description: error instanceof Error ? error.message : 'Payment verification failed',
                            variant: 'destructive',
                        });
                    } finally {
                        setSubmitting(false);
                    }
                },
                theme: { color: '#00ff88' },
                modal: {
                    ondismiss: () => {
                        toast({
                            title: 'Payment Cancelled',
                            description: 'You can retry payment from your dashboard.',
                        });
                        setSubmitting(false);
                        navigate('/dashboard');
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', (response) => {
                toast({
                    title: 'Payment Failed',
                    description: response.error.description,
                    variant: 'destructive',
                });
                setSubmitting(false);
            });
            razorpay.open();

        } catch (error) {
            console.error('Payment error:', error);
            toast({
                title: 'Payment Error',
                description: error instanceof Error ? error.message : 'Failed to initiate payment',
                variant: 'destructive',
            });
            setSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !ticket) return;

        // Validate required fields
        const invalidFields = (ticket.form_fields || []).filter(
            (field) => field.required && !formData[field.id]
        );

        if (invalidFields.length > 0) {
            toast({
                title: 'Validation Error',
                description: `Please fill in: ${invalidFields.map((f) => f.label).join(', ')}`,
                variant: 'destructive',
            });
            return;
        }

        setSubmitting(true);

        // Validate referral code if provided
        let validReferralCode: string | null = null;
        if (referralCode.trim()) {
            const { data: referrer, error: refError } = await supabase
                .from('profiles')
                .select('id')
                .eq('referral_code', referralCode.trim())
                .maybeSingle();

            if (refError) {
                console.error('Referral validation error:', refError);
                toast({
                    title: 'Validation Error',
                    description: 'Could not validate referral code. Please try again.',
                    variant: 'destructive',
                });
                setSubmitting(false);
                return;
            }

            if (referrer) {
                validReferralCode = referralCode.trim();
            } else {
                toast({
                    title: 'Invalid Referral Code',
                    description: 'The referral code you entered does not exist.',
                    variant: 'destructive',
                });
                setSubmitting(false);
                return;
            }
        }

        const registrationId = generateRegistrationId();

        // Determine if this is a free or paid ticket
        const isFreeTicket = ticket.price === 0;

        // Verify profile exists in database before creating registration
        const { data: profileCheck, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        if (profileError || !profileCheck) {
            console.error('Profile verification failed:', profileError);
            toast({
                title: 'Profile Error',
                description: 'Your profile was not found. Please try logging out and back in.',
                variant: 'destructive',
            });
            setSubmitting(false);
            return;
        }

        // Create registration
        const { data: registrationData, error } = await supabase
            .from('registrations')
            .insert({
                user_id: user.id,
                ticket_id: ticket.id,
                form_data: formData,
                status: isFreeTicket ? 'confirmed' : 'pending',
                referred_by: validReferralCode,
                registration_id: registrationId,
            })
            .select('id')
            .single();

        if (error || !registrationData) {
            toast({ title: 'Error', description: error?.message || 'Failed to create registration', variant: 'destructive' });
            setSubmitting(false);
            return;
        }

        // If free ticket, complete immediately
        if (isFreeTicket) {
            toast({
                title: 'Registration Successful!',
                description: `Your registration ID is ${registrationId}`,
            });
            navigate('/dashboard');
            return;
        }

        // For paid tickets, initiate payment
        await handlePayment(registrationId, registrationData.id);
    };

    const renderField = (field: FormField) => {
        const baseInputClass = "w-full bg-background border border-border rounded px-4 py-3 text-primary font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

        switch (field.type) {
            case 'textarea':
                return (
                    <textarea
                        value={String(formData[field.id] || '')}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className={`${baseInputClass} h-24 resize-none`}
                        required={field.required}
                    />
                );

            case 'select':
                return (
                    <select
                        value={String(formData[field.id] || '')}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className={baseInputClass}
                        required={field.required}
                    >
                        <option value="">Select an option</option>
                        {(field.options || []).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                );

            case 'checkbox':
                return (
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={Boolean(formData[field.id])}
                            onChange={(e) => handleInputChange(field.id, e.target.checked)}
                            className="w-5 h-5 accent-primary"
                        />
                        <span className="text-primary font-mono">{field.label}</span>
                    </label>
                );

            default:
                return (
                    <input
                        type={field.type}
                        value={String(formData[field.id] || '')}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className={baseInputClass}
                        required={field.required}
                    />
                );
        }
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-primary font-mono animate-pulse">LOADING...</div>
            </div>
        );
    }

    if (!ticket) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background relative scanlines flex flex-col">
            <Navigation />

            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />

                <div className="relative z-10 w-full max-w-lg">
                    <h1 className="text-2xl md:text-4xl font-display font-bold text-primary glow-text mb-2 text-center tracking-wider">
                        {ticket.title}
                    </h1>
                    {ticket.description && (
                        <p className="text-muted-foreground font-mono text-sm text-center mb-6">
                            {ticket.description}
                        </p>
                    )}

                    <div className="terminal-card">
                        <div className="terminal-header">
                            <span className="terminal-dot terminal-dot-red" />
                            <span className="terminal-dot terminal-dot-yellow" />
                            <span className="terminal-dot terminal-dot-green" />
                            <span className="text-xs text-muted-foreground ml-2 font-mono">
                                register://ticket
                            </span>
                        </div>

                        <div className="p-6 md:p-8">
                            {/* User Info Section */}
                            <div className="mb-6 pb-6 border-b border-border">
                                <p className="text-xs text-muted-foreground font-mono mb-3">YOUR INFO</p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Name:</span>
                                        <span className="text-primary font-mono">{profile?.full_name || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="text-primary font-mono">{profile?.email || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Phone:</span>
                                        <span className="text-primary font-mono">{profile?.phone || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {(ticket.form_fields || []).map((field) => (
                                    <div key={field.id}>
                                        {field.type !== 'checkbox' && (
                                            <label className="block text-sm text-primary/80 font-mono mb-2">
                                                {field.label.toUpperCase()}
                                                {field.required && <span className="text-destructive ml-1">*</span>}
                                            </label>
                                        )}
                                        {renderField(field)}
                                    </div>
                                ))}

                                {/* Referral Code Input */}
                                <div className="pt-4 border-t border-border">
                                    <label className="block text-sm text-primary/80 font-mono mb-2">
                                        REFERRAL CODE (OPTIONAL)
                                    </label>
                                    <input
                                        type="text"
                                        value={referralCode}
                                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                        placeholder="Enter 5-digit referral code"
                                        maxLength={5}
                                        className="w-full bg-background border border-border rounded px-4 py-3 text-primary font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors tracking-widest"
                                    />
                                    <p className="text-xs text-muted-foreground font-mono mt-1">
                                        Have a friend's referral code? Enter it here.
                                    </p>
                                </div>

                                {ticket.price > 0 && (
                                    <div className="flex justify-between items-center py-4 border-t border-border">
                                        <span className="text-muted-foreground font-mono">Ticket Price:</span>
                                        <span className="text-xl font-display font-bold text-primary">₹{ticket.price}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full glow-button bg-primary text-background py-3 font-display font-bold tracking-wider rounded hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                >
                                    {submitting ? 'PROCESSING...' : ticket.price > 0 ? 'PROCEED TO PAYMENT' : 'REGISTER NOW'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default TicketRegistration;
