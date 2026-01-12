import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, LogIn } from 'lucide-react';

const navItems = [
  { label: 'HOME', href: '#home' },
  { label: 'ABOUT', href: '#about' },
  { label: 'EVENTS', href: '#events' },
  { label: 'GALLERY', href: '#gallery' },
];

export const Navigation = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map(item => item.href.slice(1));
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLoginClick = () => {
    setIsOpen(false);
    navigate('/login');
  };

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="menu-button"
        aria-label="Toggle navigation menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-primary" />
        ) : (
          <div className="flex flex-col gap-1.5">
            <span className="w-6 h-0.5 bg-primary rounded-full" />
            <span className="w-6 h-0.5 bg-primary rounded-full" />
            <span className="w-6 h-0.5 bg-primary rounded-full" />
          </div>
        )}
      </button>

      {/* Navigation Overlay */}
      {isOpen && (
        <div className="nav-overlay animate-fade-in">
          <nav className="glass-card p-8 md:p-12 rounded-2xl">
            <ul className="space-y-6">
              {navItems.map((item) => (
                <li key={item.href}>
                  <button
                    onClick={() => handleNavClick(item.href)}
                    className={`nav-link ${activeSection === item.href.slice(1)
                        ? 'text-primary glow-text'
                        : ''
                      }`}
                  >
                    <span className="text-primary/60">&gt;</span>
                    {item.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={handleLoginClick}
                  className="nav-link group"
                >
                  <LogIn className="w-5 h-5 md:w-6 md:h-6 text-primary/60 group-hover:text-primary transition-colors" />
                  LOGIN
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  );
};
