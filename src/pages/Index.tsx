import { Navigation } from '@/components/Navigation';
import { HeroSection } from '@/components/HeroSection';
import { AboutSection } from '@/components/AboutSection';
import { EventsSection } from '@/components/EventsSection';
import { GallerySection } from '@/components/GallerySection';
import { LinksSection } from '@/components/LinksSection';
import { ContactSection } from '@/components/ContactSection';
import { LocationSection } from '@/components/LocationSection';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative scanlines">
      <Navigation />

      <main>
        <HeroSection />
        <AboutSection />
        <EventsSection />
        <GallerySection />
        <LinksSection />
        <ContactSection />
        <LocationSection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
