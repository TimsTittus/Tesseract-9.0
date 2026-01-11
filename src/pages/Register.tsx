
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

const Register = () => {
    return (
        <div className="min-h-screen bg-background relative scanlines flex flex-col">
            <Navigation />

            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <h1 className="text-4xl md:text-6xl font-display font-bold text-primary glow-text mb-8">
                    REGISTER
                </h1>
                <div className="bg-card border border-primary/20 p-8 rounded-lg max-w-md w-full backdrop-blur-sm">
                    <p className="text-center text-muted-foreground">
                        Registration form coming soon...
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Register;
