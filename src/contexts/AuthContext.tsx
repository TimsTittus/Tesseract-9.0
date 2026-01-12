import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    isAdmin: boolean;
    isVolunteer: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string): Promise<Profile | null> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error || !data) {
                console.warn('Profile fetch failed:', error?.message);
                return null;
            }
            return data;
        } catch (err) {
            console.error('Profile fetch error:', err);
            return null;
        }
    };

    const refreshProfile = async () => {
        if (user) {
            const p = await fetchProfile(user.id);
            if (p) setProfile(p);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const handleSession = async (currentSession: Session | null) => {
            if (!isMounted) return;

            if (currentSession?.user) {
                setSession(currentSession);
                setUser(currentSession.user);

                const profileData = await fetchProfile(currentSession.user.id);
                if (isMounted) {
                    if (profileData) {
                        setProfile(profileData);
                    } else {
                        // Fallback profile from user metadata
                        setProfile({
                            id: currentSession.user.id,
                            full_name: currentSession.user.user_metadata?.full_name || currentSession.user.user_metadata?.name || '',
                            email: currentSession.user.email || '',
                            phone: currentSession.user.user_metadata?.phone || '',
                            referral_code: null,
                            is_admin: false,
                            is_volunteer: false,
                        });
                    }
                }
            } else {
                setSession(null);
                setUser(null);
                setProfile(null);
            }

            if (isMounted) {
                setLoading(false);
            }
        };

        // Get initial session
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            handleSession(s);
        }).catch((err) => {
            console.error('getSession error:', err);
            if (isMounted) setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, newSession) => {
                handleSession(newSession);
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
    };

    const isAdmin = profile?.is_admin ?? false;
    const isVolunteer = profile?.is_volunteer ?? false;

    return (
        <AuthContext.Provider value={{ user, session, profile, loading, isAdmin, isVolunteer, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
