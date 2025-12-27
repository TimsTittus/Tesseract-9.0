import { Globe, Instagram, Linkedin, Mail } from 'lucide-react';

const links = [
  {
    icon: Globe,
    title: 'IEEE SB SJCET',
    subtitle: 'Official Website',
    href: '#',
  },
  {
    icon: Instagram,
    title: 'INSTAGRAM',
    subtitle: '@ieee_sb_sjcet',
    href: 'https://instagram.com/ieee_sb_sjcet',
  },
  {
    icon: Linkedin,
    title: 'LINKEDIN',
    subtitle: 'IEEE SB SJCET',
    href: 'https://linkedin.com/company/ieee-sb-sjcet',
  },
  {
    icon: Mail,
    title: 'EMAIL',
    subtitle: 'contact@ieeesbsjcet.org',
    href: 'mailto:contact@ieeesbsjcet.org',
  },
];

export const LinksSection = () => {
  return (
    <section className="py-20 px-4 relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />

      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Section Title */}
        <h2 className="section-title font-display">LINKS</h2>
        <div className="section-underline mb-8" />

        {/* Subtitle */}
        <p className="section-subtitle mb-12">
          <span className="text-primary">&gt;</span> Connect with us
        </p>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="link-card group"
            >
              {/* Icon */}
              <div className="p-3 rounded-xl bg-secondary/80 border border-border group-hover:border-primary/50 transition-colors">
                <link.icon className="w-6 h-6 text-primary" />
              </div>

              {/* Content */}
              <div>
                <h3 className="font-display font-semibold text-primary tracking-wide">
                  {link.title}
                </h3>
                <p className="text-muted-foreground text-sm">{link.subtitle}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Stay Connected */}
        <div className="mt-12 flex justify-center">
          <div className="glass-card glow-border px-8 py-4">
            <span className="text-sm md:text-base font-mono text-primary">
              <span className="text-primary/60">&gt;</span> Stay connected for
              updates
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
