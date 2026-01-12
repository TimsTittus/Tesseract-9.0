import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface VolunteerRouteProps {
    children: ReactNode;
}

export const VolunteerRoute = ({ children }: VolunteerRouteProps) => {
    const { user, loading, isAdmin, isVolunteer } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-primary font-mono animate-pulse">AUTHENTICATING...</div>
            </div>
        );
    }

    // Allow access if user is admin OR volunteer
    if (!user || (!isAdmin && !isVolunteer)) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
