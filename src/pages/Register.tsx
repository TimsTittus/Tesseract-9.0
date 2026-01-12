import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

const Register = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleGoogleRegister = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        });

        if (error) {
            toast({
                title: 'Registration Failed',
                description: error.message,
                variant: 'destructive',
            });
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.phone || !formData.password) {
            toast({
                title: 'Validation Error',
                description: 'Please fill in all fields.',
                variant: 'destructive',
            });
            return;
        }

        if (formData.password.length < 6) {
            toast({
                title: 'Validation Error',
                description: 'Password must be at least 6 characters.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    full_name: formData.name,
                    phone: formData.phone,
                },
            },
        });

        if (error) {
            toast({
                title: 'Registration Failed',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'Registration Successful',
                description: 'Please check your email inbox / spam to verify your account.',
            });
            navigate('/dashboard');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-background relative scanlines flex flex-col">
            <Navigation />

            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />

                <div className="relative z-10 w-full max-w-md">
                    <h1 className="text-3xl md:text-5xl font-display font-bold text-primary glow-text mb-8 text-center tracking-wider">
                        REGISTER
                    </h1>

                    <div className="terminal-card">
                        <div className="terminal-header">
                            <span className="terminal-dot terminal-dot-red" />
                            <span className="terminal-dot terminal-dot-yellow" />
                            <span className="terminal-dot terminal-dot-green" />
                            <span className="text-xs text-muted-foreground ml-2 font-mono">
                                auth://register
                            </span>
                        </div>

                        <div className="p-6 md:p-8 space-y-6">
                            <button
                                onClick={handleGoogleRegister}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 border border-border bg-secondary/30 py-3 rounded font-mono text-primary hover:bg-secondary/50 hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                CONTINUE WITH GOOGLE
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="bg-card px-4 text-muted-foreground font-mono">
                                        OR
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block text-sm text-primary/80 font-mono mb-2"
                                    >
                                        FULL NAME
                                    </label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className="w-full bg-background border border-border rounded px-4 py-3 text-primary font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm text-primary/80 font-mono mb-2"
                                    >
                                        EMAIL
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="user@example.com"
                                        className="w-full bg-background border border-border rounded px-4 py-3 text-primary font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="phone"
                                        className="block text-sm text-primary/80 font-mono mb-2"
                                    >
                                        PHONE
                                    </label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+91 9876543210"
                                        className="w-full bg-background border border-border rounded px-4 py-3 text-primary font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="password"
                                        className="block text-sm text-primary/80 font-mono mb-2"
                                    >
                                        PASSWORD
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full bg-background border border-border rounded px-4 py-3 text-primary font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                        disabled={loading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full glow-button bg-primary text-background py-3 font-display font-bold tracking-wider rounded hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                                >
                                    {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                                </button>
                            </form>

                            <p className="text-center text-sm text-muted-foreground font-mono mt-6">
                                Already have an account?{' '}
                                <Link
                                    to="/login"
                                    className="text-primary hover:underline hover:glow-text transition-all"
                                >
                                    Login here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Register;
