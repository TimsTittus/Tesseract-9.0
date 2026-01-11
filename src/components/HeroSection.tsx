// use static logo from public folder
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

      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-8 relative z-10">
        <img
          src="/tesseractlogo.png"
          alt="Tesseract 9.0 logo"
          className="w-20 h-20 md:w-28 md:h-28 mb-6 animate-float object-contain"
        />

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-primary tracking-wider text-center glow-text mb-8">
          TESSERACT 9.0
        </h1>



        <Countdown />
      </div>

      <div className="relative z-10 mt-auto">
        <PixelArtScene />
      </div>
    </section>
  );
};
