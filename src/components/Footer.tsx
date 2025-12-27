import { Heart } from 'lucide-react';
import { TesseractLogo } from './TesseractLogo';

export const Footer = () => {
  return (
    <footer className="py-12 px-4 border-t border-border relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-10 pointer-events-none" />

      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <TesseractLogo className="w-12 h-12 text-primary opacity-50" />

          {/* Event Name */}
          <p className="font-display text-sm text-muted-foreground tracking-widest text-center">
            TESSERACT 9.0 – Annual Flagship Event of IEEE SB SJCET
          </p>

          {/* Created With Love */}
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            Created with{' '}
            <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />{' '}
            by IEEE SB SJCET
          </p>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} IEEE SB SJCET. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
