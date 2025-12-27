import { MapPin, Navigation } from 'lucide-react';

export const LocationSection = () => {
  const coordinates = {
    lat: '9.6082° N',
    lon: '76.6947° E',
  };

  const handleGetDirections = () => {
    window.open(
      'https://www.google.com/maps/search/?api=1&query=9.6082,76.6947',
      '_blank'
    );
  };

  return (
    <section className="py-20 px-4 relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />

      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Section Title */}
        <h2 className="section-title font-display">LOCATION</h2>
        <div className="section-underline mb-8" />

        {/* Subtitle */}
        <p className="section-subtitle mb-12">
          <span className="text-primary">&gt;</span> Find us here
        </p>

        {/* Map Placeholder */}
        <div className="terminal-card mb-6">
          {/* Coordinates Badge */}
          <div className="absolute top-4 left-4 z-10">
            <div className="glass-card px-4 py-2 backdrop-blur-md">
              <span className="font-mono text-sm text-muted-foreground">
                LAT: {coordinates.lat} | LON: {coordinates.lon}
              </span>
            </div>
          </div>

          {/* Map Placeholder Area */}
          <div className="aspect-video bg-secondary/30 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-primary/20 border-2 border-primary">
                <MapPin className="w-10 h-10 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Venue Info Card */}
        <div className="terminal-card">
          {/* Terminal Header */}
          <div className="terminal-header">
            <span className="terminal-dot-red" />
            <span className="terminal-dot-yellow" />
            <span className="terminal-dot-green" />
            <span className="text-muted-foreground text-sm ml-2 font-mono">
              location_data.txt
            </span>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Venue */}
            <div>
              <span className="text-muted-foreground text-sm block">
                &gt; VENUE
              </span>
              <h3 className="text-lg md:text-xl font-display font-semibold text-primary tracking-wide">
                ST. JOSEPH'S COLLEGE OF ENGINEERING AND TECHNOLOGY
              </h3>
              <p className="text-foreground mt-1">Palai, Kerala</p>
            </div>

            {/* Address */}
            <div>
              <span className="text-muted-foreground text-sm block">
                &gt; ADDRESS
              </span>
              <p className="text-foreground">
                Choondacherry P.O.
                <br />
                Palai, Kottayam
                <br />
                Kerala - 686579
              </p>
            </div>
          </div>
        </div>

        {/* Get Directions Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleGetDirections}
            className="glass-card glow-button px-8 py-4 flex items-center gap-3 font-mono text-primary hover:border-primary/50 transition-all duration-300 group"
          >
            <Navigation className="w-5 h-5 group-hover:animate-pulse" />
            <span>GET DIRECTIONS</span>
          </button>
        </div>
      </div>
    </section>
  );
};
