import { useState, useEffect } from 'react';
import { VolunteerLayout } from '@/components/volunteer/VolunteerLayout';
import { QRScanner } from '@/components/QRScanner';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { FoodCoupon } from '@/types';
import { CheckCircle, XCircle, User, Ticket, Calendar, Search, UtensilsCrossed, UserCheck, ChevronDown, AlertTriangle } from 'lucide-react';

type ScanMode = 'checkin' | 'food';

interface ScannedParticipant {
    id: string;
    registration_id: string;
    ticket_id: string;
    profile: {
        full_name: string;
        email: string;
        phone: string;
    };
    ticket: {
        title: string;
    };
    checked_in: boolean;
    checked_in_at: string | null;
    created_at: string;
}

interface CouponStatus {
    consumed: boolean;
    consumed_at?: string;
    remaining: number;
}

const VolunteerCheckin = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [mode, setMode] = useState<ScanMode>('checkin');
    const [scannedParticipant, setScannedParticipant] = useState<ScannedParticipant | null>(null);
    const [loading, setLoading] = useState(false);
    const [checkingIn, setCheckingIn] = useState(false);
    const [manualId, setManualId] = useState('');

    // Food coupon state
    const [coupons, setCoupons] = useState<FoodCoupon[]>([]);
    const [selectedCoupon, setSelectedCoupon] = useState<FoodCoupon | null>(null);
    const [couponStatus, setCouponStatus] = useState<CouponStatus | null>(null);
    const [couponDropdownOpen, setCouponDropdownOpen] = useState(false);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        const { data, error } = await supabase
            .from('food_coupons')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) {
            console.error('Failed to fetch coupons:', error);
            return;
        }

        setCoupons(data || []);
        if (data && data.length > 0) {
            setSelectedCoupon(data[0]);
        }
    };

    const handleScan = async (registrationId: string) => {
        setLoading(true);
        setScannedParticipant(null);
        setCouponStatus(null);

        try {
            const { data, error } = await supabase
                .from('registrations')
                .select('id, registration_id, ticket_id, checked_in, checked_in_at, created_at, profile:profiles!fk_registrations_profile(full_name, email, phone), ticket:tickets(title)')
                .eq('registration_id', registrationId)
                .eq('status', 'confirmed')
                .single();

            if (error || !data) {
                toast({
                    title: 'Not Found',
                    description: 'No confirmed registration found with this QR code.',
                    variant: 'destructive',
                });
                setLoading(false);
                return;
            }

            setScannedParticipant(data as unknown as ScannedParticipant);

            // If in food mode, check coupon eligibility
            if (mode === 'food' && selectedCoupon) {
                await checkCouponStatus(data.id, selectedCoupon, data.ticket_id);
            }
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to lookup registration.',
                variant: 'destructive',
            });
        }

        setLoading(false);
    };

    const checkCouponStatus = async (registrationId: string, coupon: FoodCoupon, ticketId: string) => {
        // Check if ticket is eligible
        if (!coupon.ticket_ids.includes(ticketId)) {
            setCouponStatus({
                consumed: false,
                remaining: 0,
            });
            return;
        }

        // Check existing consumptions
        const { data, error } = await supabase
            .from('coupon_consumptions')
            .select('id, consumed_at')
            .eq('registration_id', registrationId)
            .eq('coupon_id', coupon.id);

        if (error) {
            console.error('Failed to check coupon status:', error);
            return;
        }

        const consumedCount = data?.length || 0;
        const remaining = coupon.quantity - consumedCount;

        if (consumedCount > 0 && remaining <= 0) {
            setCouponStatus({
                consumed: true,
                consumed_at: data[data.length - 1].consumed_at,
                remaining: 0,
            });
        } else {
            setCouponStatus({
                consumed: false,
                remaining,
            });
        }
    };

    const handleConfirmCheckin = async () => {
        if (!scannedParticipant || !user) return;

        setCheckingIn(true);

        try {
            const { error } = await supabase
                .from('registrations')
                .update({
                    checked_in: true,
                    checked_in_at: new Date().toISOString(),
                    checked_in_by: user.id,
                })
                .eq('id', scannedParticipant.id);

            if (error) throw error;

            toast({
                title: 'Checked In!',
                description: `${scannedParticipant.profile.full_name} has been checked in successfully.`,
            });

            setScannedParticipant(null);
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to check in participant.',
                variant: 'destructive',
            });
        }

        setCheckingIn(false);
    };

    const handleConfirmCouponConsumption = async () => {
        if (!scannedParticipant || !user || !selectedCoupon) return;

        setCheckingIn(true);

        try {
            const { error } = await supabase
                .from('coupon_consumptions')
                .insert({
                    registration_id: scannedParticipant.id,
                    coupon_id: selectedCoupon.id,
                    consumed_by: user.id,
                });

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    toast({
                        title: 'Already Consumed',
                        description: 'This coupon has already been fully consumed for this registration.',
                        variant: 'destructive',
                    });
                } else {
                    throw error;
                }
            } else {
                toast({
                    title: 'Coupon Marked!',
                    description: `${selectedCoupon.name} marked for ${scannedParticipant.profile.full_name}.`,
                });
            }

            setScannedParticipant(null);
            setCouponStatus(null);
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to mark coupon consumption.',
                variant: 'destructive',
            });
        }

        setCheckingIn(false);
    };

    const handleCancel = () => {
        setScannedParticipant(null);
        setCouponStatus(null);
    };

    const isTicketEligible = selectedCoupon && scannedParticipant
        ? selectedCoupon.ticket_ids.includes(scannedParticipant.ticket_id)
        : false;

    return (
        <VolunteerLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-display text-primary glow-text tracking-wider">
                        SCANNERS
                    </h2>
                    <p className="text-muted-foreground font-mono text-sm mt-1">
                        Scan participant QR codes for check-in or food coupons
                    </p>
                </div>

                {/* Mode Toggle */}
                <div className="terminal-card p-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setMode('checkin'); setScannedParticipant(null); setCouponStatus(null); }}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded font-mono text-sm transition-all ${mode === 'checkin'
                                    ? 'bg-primary text-background'
                                    : 'bg-secondary/30 text-primary/70 hover:bg-secondary/50'
                                }`}
                        >
                            <UserCheck className="w-4 h-4" />
                            Check-in
                        </button>
                        <button
                            onClick={() => { setMode('food'); setScannedParticipant(null); setCouponStatus(null); }}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded font-mono text-sm transition-all ${mode === 'food'
                                    ? 'bg-primary text-background'
                                    : 'bg-secondary/30 text-primary/70 hover:bg-secondary/50'
                                }`}
                        >
                            <UtensilsCrossed className="w-4 h-4" />
                            Food Coupon
                        </button>
                    </div>
                </div>

                {/* Coupon Selector (Food Mode Only) */}
                {mode === 'food' && (
                    <div className="terminal-card p-4">
                        <label className="block text-sm font-mono text-muted-foreground mb-2">
                            SELECT COUPON
                        </label>
                        <div className="relative">
                            <button
                                onClick={() => setCouponDropdownOpen(!couponDropdownOpen)}
                                className="w-full flex items-center justify-between bg-background border border-border rounded px-4 py-3 text-primary font-mono focus:border-primary"
                            >
                                <span>{selectedCoupon?.name || 'Select a coupon'}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${couponDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {couponDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded shadow-lg z-10 max-h-48 overflow-y-auto">
                                    {coupons.length === 0 ? (
                                        <div className="px-4 py-3 text-sm text-muted-foreground font-mono">
                                            No active coupons available
                                        </div>
                                    ) : (
                                        coupons.map((coupon) => (
                                            <button
                                                key={coupon.id}
                                                onClick={() => {
                                                    setSelectedCoupon(coupon);
                                                    setCouponDropdownOpen(false);
                                                    setScannedParticipant(null);
                                                    setCouponStatus(null);
                                                }}
                                                className={`w-full px-4 py-3 text-left font-mono text-sm hover:bg-secondary/30 transition-colors ${selectedCoupon?.id === coupon.id ? 'bg-primary/10 text-primary' : 'text-primary/70'
                                                    }`}
                                            >
                                                {coupon.name}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        {selectedCoupon && (
                            <p className="mt-2 text-xs font-mono text-muted-foreground">
                                Quantity: {selectedCoupon.quantity} per registration
                            </p>
                        )}
                    </div>
                )}

                {!scannedParticipant && !loading && (
                    <div className="space-y-6">
                        {/* Manual Entry */}
                        <div className="terminal-card p-4 sm:p-6">
                            <h3 className="text-sm font-mono text-muted-foreground mb-3">MANUAL ENTRY</h3>
                            <form onSubmit={(e) => { e.preventDefault(); if (manualId.trim()) handleScan(manualId.trim().toUpperCase()); }} className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="text"
                                    value={manualId}
                                    onChange={(e) => setManualId(e.target.value.toUpperCase())}
                                    placeholder="Enter Registration ID"
                                    className="flex-1 bg-background border border-border rounded px-4 py-3 text-primary font-mono tracking-wider focus:border-primary uppercase text-center sm:text-left"
                                    maxLength={10}
                                />
                                <button
                                    type="submit"
                                    disabled={!manualId.trim() || (mode === 'food' && !selectedCoupon)}
                                    className="flex items-center justify-center gap-2 bg-primary text-background px-6 py-3 font-display font-bold rounded hover:scale-105 transition-transform disabled:opacity-50"
                                >
                                    <Search className="w-5 h-5" />
                                    Lookup
                                </button>
                            </form>
                        </div>

                        {/* QR Scanner */}
                        <div className="terminal-card p-4 sm:p-6">
                            <h3 className="text-sm font-mono text-muted-foreground mb-3">OR SCAN QR CODE</h3>
                            <QRScanner onScan={handleScan} />
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="terminal-card p-8 text-center">
                        <div className="text-primary font-mono animate-pulse">Looking up participant...</div>
                    </div>
                )}

                {/* Check-in Mode Confirmation */}
                {scannedParticipant && mode === 'checkin' && (
                    <div className="terminal-card p-6">
                        <div className="text-center mb-6">
                            {scannedParticipant.checked_in ? (
                                <div className="inline-flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-full font-mono text-sm mb-4">
                                    <CheckCircle className="w-5 h-5" />
                                    Already Checked In
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 text-primary bg-primary/10 px-4 py-2 rounded-full font-mono text-sm mb-4">
                                    <User className="w-5 h-5" />
                                    Ready to Check In
                                </div>
                            )}
                        </div>

                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-display text-primary mb-2">
                                {scannedParticipant.profile.full_name}
                            </h3>
                            <p className="text-muted-foreground font-mono text-sm">
                                {scannedParticipant.profile.email}
                            </p>
                            <p className="text-muted-foreground font-mono text-sm">
                                {scannedParticipant.profile.phone}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-secondary/20 p-4 rounded text-center">
                                <Ticket className="w-6 h-6 text-primary mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground font-mono">Ticket</p>
                                <p className="text-sm text-primary font-mono">{scannedParticipant.ticket.title}</p>
                            </div>
                            <div className="bg-secondary/20 p-4 rounded text-center">
                                <Calendar className="w-6 h-6 text-primary mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground font-mono">Registration ID</p>
                                <p className="text-sm text-primary font-mono tracking-wider">{scannedParticipant.registration_id}</p>
                            </div>
                        </div>

                        {scannedParticipant.checked_in ? (
                            <div className="text-center">
                                <p className="text-muted-foreground font-mono text-sm mb-4">
                                    Checked in at: {new Date(scannedParticipant.checked_in_at!).toLocaleString()}
                                </p>
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center justify-center gap-2 mx-auto px-6 py-3 border border-primary text-primary rounded font-mono hover:bg-primary/10"
                                >
                                    Scan Another
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center justify-center gap-2 px-6 py-3 border border-border text-muted-foreground rounded font-mono hover:bg-secondary/50 order-2 sm:order-1"
                                >
                                    <XCircle className="w-5 h-5" />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmCheckin}
                                    disabled={checkingIn}
                                    className="flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 font-display font-bold rounded hover:scale-105 transition-transform disabled:opacity-50 order-1 sm:order-2"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    {checkingIn ? 'Checking In...' : 'Confirm Check-In'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Food Mode Confirmation */}
                {scannedParticipant && mode === 'food' && selectedCoupon && (
                    <div className="terminal-card p-6">
                        <div className="text-center mb-6">
                            {!isTicketEligible ? (
                                <div className="inline-flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-2 rounded-full font-mono text-sm mb-4">
                                    <AlertTriangle className="w-5 h-5" />
                                    Ticket Not Eligible
                                </div>
                            ) : couponStatus?.consumed ? (
                                <div className="inline-flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-full font-mono text-sm mb-4">
                                    <CheckCircle className="w-5 h-5" />
                                    Already Consumed
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 text-green-500 bg-green-500/10 px-4 py-2 rounded-full font-mono text-sm mb-4">
                                    <UtensilsCrossed className="w-5 h-5" />
                                    Ready to Mark
                                </div>
                            )}
                        </div>

                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-display text-primary mb-2">
                                {scannedParticipant.profile.full_name}
                            </h3>
                            <p className="text-muted-foreground font-mono text-sm">
                                {scannedParticipant.profile.email}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-secondary/20 p-4 rounded text-center">
                                <Ticket className="w-6 h-6 text-primary mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground font-mono">Ticket</p>
                                <p className="text-sm text-primary font-mono">{scannedParticipant.ticket.title}</p>
                            </div>
                            <div className="bg-secondary/20 p-4 rounded text-center">
                                <UtensilsCrossed className="w-6 h-6 text-primary mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground font-mono">Coupon</p>
                                <p className="text-sm text-primary font-mono">{selectedCoupon.name}</p>
                            </div>
                        </div>

                        {isTicketEligible && couponStatus && (
                            <div className="bg-secondary/10 p-4 rounded mb-6 text-center">
                                <p className="text-sm font-mono text-muted-foreground">
                                    {couponStatus.consumed ? (
                                        <>
                                            All {selectedCoupon.quantity} coupon(s) consumed.
                                            <br />
                                            Last used: {new Date(couponStatus.consumed_at!).toLocaleString()}
                                        </>
                                    ) : (
                                        <>Remaining: <span className="text-primary">{couponStatus.remaining}</span> of {selectedCoupon.quantity}</>
                                    )}
                                </p>
                            </div>
                        )}

                        {!isTicketEligible ? (
                            <div className="text-center">
                                <p className="text-muted-foreground font-mono text-sm mb-4">
                                    This ticket type is not eligible for "{selectedCoupon.name}".
                                </p>
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center justify-center gap-2 mx-auto px-6 py-3 border border-primary text-primary rounded font-mono hover:bg-primary/10"
                                >
                                    Scan Another
                                </button>
                            </div>
                        ) : couponStatus?.consumed ? (
                            <div className="text-center">
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center justify-center gap-2 mx-auto px-6 py-3 border border-primary text-primary rounded font-mono hover:bg-primary/10"
                                >
                                    Scan Another
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center justify-center gap-2 px-6 py-3 border border-border text-muted-foreground rounded font-mono hover:bg-secondary/50 order-2 sm:order-1"
                                >
                                    <XCircle className="w-5 h-5" />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmCouponConsumption}
                                    disabled={checkingIn}
                                    className="flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 font-display font-bold rounded hover:scale-105 transition-transform disabled:opacity-50 order-1 sm:order-2"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    {checkingIn ? 'Marking...' : 'Confirm Consumption'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </VolunteerLayout>
    );
};

export default VolunteerCheckin;
