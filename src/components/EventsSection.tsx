import { Lock } from 'lucide-react';

const events = [
  { title: 'TECHNICAL WORKSHOPS', locked: true },
  { title: 'SPECIAL GUEST', locked: true },
  { title: 'CULTURAL NIGHT', locked: true },
  { title: 'TECH TALKS', locked: true },
];

export const EventsSection = () => {
  return (
    <section id="events" className="py-20 px-4 relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />

      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Section Title */}
        <h2 className="section-title font-display">EVENTS</h2>
        <div className="section-underline mb-8" />

        {/* Loading Indicator */}
        <p className="section-subtitle mb-12">
          <span className="text-primary">&gt;</span> Plans loading
          <span className="animate-blink">...</span>
        </p>

        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event, index) => (
            <div
              key={index}
              className="event-card-locked group transition-all duration-300 hover:border-primary/50"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Lock Icon */}
              <div className="flex justify-center mb-4 relative z-10">
                <div className="p-4 rounded-xl bg-secondary/80 border border-border group-hover:border-primary/50 transition-colors">
                  <Lock className="w-8 h-8 text-primary/70" />
                </div>
              </div>

              {/* Event Title */}
              <h3 className="text-lg font-display font-semibold text-primary tracking-wide mb-2 relative z-10">
                {event.title}
              </h3>

              {/* Description */}
              <p className="text-muted-foreground text-sm relative z-10">
                Event details will be revealed soon...
              </p>

              {/* Progress Line */}
              <div className="mt-4 relative z-10">
                <div className="h-0.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full w-1/4 bg-primary rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
