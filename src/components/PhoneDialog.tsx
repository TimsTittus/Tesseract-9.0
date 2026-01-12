import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface PhoneDialogProps {
    open: boolean;
    onComplete: () => void;
}

export const PhoneDialog = ({ open, onComplete }: PhoneDialogProps) => {
    const { user, refreshProfile } = useAuth();
    const { toast } = useToast();
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phone.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Please enter your phone number.',
                variant: 'destructive',
            });
            return;
        }

        if (!user) return;

        setLoading(true);

        const { error } = await supabase
            .from('profiles')
            .update({ phone: phone.trim() })
            .eq('id', user.id);

        if (error) {
            toast({
                title: 'Error',
                description: 'Failed to save phone number. Please try again.',
                variant: 'destructive',
            });
        } else {
            await refreshProfile();
            toast({
                title: 'Success',
                description: 'Phone number saved successfully.',
            });
            onComplete();
        }

        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="terminal-card border-primary/30 sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-display text-primary glow-text tracking-wider">
                        COMPLETE PROFILE
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground font-mono">
                        Please enter your phone number to continue.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div>
                        <label
                            htmlFor="phone-dialog"
                            className="block text-sm text-primary/80 font-mono mb-2"
                        >
                            PHONE NUMBER
                        </label>
                        <input
                            id="phone-dialog"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 9876543210"
                            className="w-full bg-background border border-border rounded px-4 py-3 text-primary font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full glow-button bg-primary text-background py-3 font-display font-bold tracking-wider rounded hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'SAVING...' : 'CONTINUE'}
                    </button>
                </form>
            </DialogContent>
        </Dialog>
    );
};
