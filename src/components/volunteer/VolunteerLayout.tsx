import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { QrCode, Users, LogOut, Home, Menu, X } from 'lucide-react';

interface VolunteerLayoutProps {
    children: ReactNode;
}

const navItems = [
    { href: '/volunteer', label: 'Scanners', icon: QrCode },
    { href: '/volunteer/participants', label: 'Participants', icon: Users },
];

export const VolunteerLayout = ({ children }: VolunteerLayoutProps) => {
    const { profile, signOut, isAdmin } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="min-h-screen bg-background flex">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div>
                        <Link to="/" className="flex items-center gap-2" onClick={closeSidebar}>
                            <span className="text-xl font-display font-bold text-primary glow-text tracking-wider">
                                TESSERACT
                            </span>
                        </Link>
                        <span className="text-xs text-muted-foreground font-mono">Volunteer Panel</span>
                    </div>
                    <button
                        onClick={closeSidebar}
                        className="lg:hidden p-2 text-primary hover:bg-secondary/50 rounded"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={closeSidebar}
                                className={`flex items-center gap-3 px-3 py-2 rounded font-mono text-sm transition-colors ${isActive
                                    ? 'bg-primary text-background'
                                    : 'text-primary/70 hover:bg-secondary/50 hover:text-primary'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border space-y-2">
                    <Link
                        to="/"
                        onClick={closeSidebar}
                        className="flex items-center gap-3 px-3 py-2 rounded font-mono text-sm text-primary/70 hover:bg-secondary/50 hover:text-primary transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Back to Site
                    </Link>
                    {isAdmin && (
                        <Link
                            to="/admin"
                            onClick={closeSidebar}
                            className="flex items-center gap-3 px-3 py-2 rounded font-mono text-sm text-primary/70 hover:bg-secondary/50 hover:text-primary transition-colors"
                        >
                            <Users className="w-4 h-4" />
                            Admin Panel
                        </Link>
                    )}
                    <button
                        onClick={() => {
                            closeSidebar();
                            signOut();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded font-mono text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-primary hover:bg-secondary/50 rounded"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h1 className="text-lg font-display text-primary">Volunteer Panel</h1>
                    </div>
                    <div className="flex items-center gap-2 lg:gap-3">
                        <span className="text-sm text-muted-foreground font-mono hidden sm:block">
                            {profile?.full_name || profile?.email}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">
                                {(profile?.full_name || profile?.email || 'V')[0].toUpperCase()}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-4 lg:p-6 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
