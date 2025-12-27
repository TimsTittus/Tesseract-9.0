import { TesseractLogo } from './TesseractLogo';
import { Countdown } from './Countdown';
import { PixelArtScene } from './PixelArtScene';

export const HeroSection = () => {
  return (
    <section
      id="home"
      className="min-h-screen flex flex-col relative overflow-hidden"
    >
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />
      
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-8 relative z-10">
        {/* Logo */}
        <TesseractLogo className="w-20 h-20 md:w-28 md:h-28 text-primary mb-6 animate-float" />
        
        {/* Main Title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-primary tracking-wider text-center glow-text mb-8">
          TESSERACT 9.0
        </h1>
        
        {/* Coming Soon Box */}
        <div className="glass-card glow-border px-8 md:px-16 py-4 md:py-6 mb-10 relative">
          <span className="text-xl md:text-3xl font-display font-bold text-primary tracking-widest typing-cursor">
            COMING SOON
          </span>
          
          {/* Decorative Space Invader */}
          <div className="absolute -right-12 md:-right-16 top-1/2 -translate-y-1/2 text-primary opacity-80">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="currentColor">
              <rect x="8" y="4" width="4" height="4" />
              <rect x="28" y="4" width="4" height="4" />
              <rect x="12" y="8" width="4" height="4" />
              <rect x="24" y="8" width="4" height="4" />
              <rect x="4" y="12" width="32" height="4" />
              <rect x="4" y="16" width="8" height="4" />
              <rect x="16" y="16" width="8" height="4" />
              <rect x="28" y="16" width="8" height="4" />
              <rect x="0" y="20" width="4" height="4" />
              <rect x="8" y="20" width="24" height="4" />
              <rect x="36" y="20" width="4" height="4" />
              <rect x="0" y="24" width="4" height="4" />
              <rect x="8" y="24" width="4" height="4" />
              <rect x="28" y="24" width="4" height="4" />
              <rect x="36" y="24" width="4" height="4" />
              <rect x="12" y="28" width="4" height="4" />
              <rect x="24" y="28" width="4" height="4" />
            </svg>
          </div>
        </div>
        
        {/* Countdown Timer */}
        <Countdown />
      </div>
      
      {/* Pixel Art Footer */}
      <div className="relative z-10 mt-auto">
        <PixelArtScene />
      </div>
    </section>
  );
};
