import { User, Briefcase, Phone } from 'lucide-react';

const contacts = [
  {
    terminal: 'contact_terminal_1.exe',
    name: 'Blesson K Tomy',
    role: 'Chair, IEEE SB SJCET',
    phone: '+91 89213 03814',
  },
  {
    terminal: 'contact_terminal_2.exe',
    name: 'Ayswaryalakshmi R',
    role: 'Program Co-ordinator, IEEE SB SJCET',
    phone: '+91 94002 06919',
  },
];

export const ContactSection = () => {
  return (
    <section className="py-20 px-4 relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />

      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Section Title */}
        <h2 className="section-title font-display">ANY DOUBTS?</h2>
        <div className="section-underline mb-8" />

        {/* Subtitle */}
        <p className="section-subtitle mb-12">
          <span className="text-primary">&gt;</span> Contact our organizers
        </p>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contacts.map((contact, index) => (
            <div key={index} className="terminal-card">
              {/* Terminal Header */}
              <div className="terminal-header">
                <span className="terminal-dot-red" />
                <span className="terminal-dot-yellow" />
                <span className="terminal-dot-green" />
                <span className="text-muted-foreground text-sm ml-2 font-mono">
                  {contact.terminal}
                </span>
              </div>

              {/* Terminal Content */}
              <div className="p-5 space-y-4">
                {/* Name */}
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-muted-foreground text-sm block">
                      &gt; NAME
                    </span>
                    <span className="text-foreground font-semibold">
                      {contact.name}
                    </span>
                  </div>
                </div>

                {/* Role */}
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-muted-foreground text-sm block">
                      &gt; ROLE
                    </span>
                    <span className="text-foreground font-semibold">
                      {contact.role}
                    </span>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-muted-foreground text-sm block">
                      &gt; PHONE
                    </span>
                    <a
                      href={`tel:${contact.phone.replace(/\s/g, '')}`}
                      className="text-foreground font-semibold hover:text-primary transition-colors"
                    >
                      {contact.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
