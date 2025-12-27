import { Sparkles, Users, MapPin } from 'lucide-react';

const aboutCards = [
  {
    icon: Sparkles,
    title: 'ABOUT TESSERACT 9.0',
    content:
      "Tesseract is no less than a celebration for the IEEE SB SJCET since it's our annual flagship event. Tesseract provides an avenue for all the minds out there to meet, network, and find new opportunities. Enjoy these two days with fun workshops, a cultural night, and, of course, the food fiesta.",
  },
  {
    icon: Users,
    title: 'ONCE IN A LIFETIME EXPERIENCE',
    content:
      'Join us at Tesseract 9.0 for a once-in-a-lifetime experience where you can immerse yourself in two days of tech, fun, networking, and insightful discussions on the ever-evolving world of technology.',
  },
  {
    icon: MapPin,
    title: 'ABOUT THE HOST',
    content:
      "St. Joseph's College of Engineering and Technology, Palai is a place where diversity is celebrated. Our campus is a melting pot of cultures, backgrounds, and perspectives. You will have the opportunity to engage with a diverse community of students and faculty, broadening your horizons and fostering a global mindset.",
  },
];

export const AboutSection = () => {
  return (
    <section id="about" className="py-20 px-4 relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />

      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Section Title */}
        <h2 className="section-title font-display">ABOUT</h2>
        <div className="section-underline mb-16" />

        {/* Cards */}
        <div className="space-y-6">
          {aboutCards.map((card, index) => (
            <div
              key={index}
              className="terminal-card animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Card Header */}
              <div className="flex items-center gap-3 p-5 border-b border-border">
                <div className="p-2 rounded-lg bg-secondary/50">
                  <card.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg md:text-xl font-display font-semibold text-primary tracking-wide">
                  {card.title}
                </h3>
              </div>

              {/* Card Content */}
              <div className="p-5">
                <p className="text-foreground/80 leading-relaxed">
                  {card.content}
                </p>
                {/* Progress Bar */}
                <div className="mt-4 h-1 bg-border rounded-full overflow-hidden">
                  <div className="progress-bar w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* IEEE Badge */}
        <div className="mt-12 flex justify-center">
          <div className="glass-card glow-border px-8 py-4">
            <span className="text-sm md:text-base font-display text-primary tracking-widest">
              POWERED BY IEEE SB SJCET
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
