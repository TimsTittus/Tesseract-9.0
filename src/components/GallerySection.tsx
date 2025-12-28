import { useState, useEffect } from 'react';

const galleryImages = [
  { id: 'img1', src: '/gallery/img8.webp' },
  { id: 'img2', src: '/gallery/tess7_2.jpg' },
  { id: 'img3', src: '/gallery/tess7_4.jpg' },
  { id: 'img4', src: '/gallery/img5.webp' },
  { id: 'img5', src: '/gallery/img7.webp' },
  { id: 'img6', src: '/gallery/tess7_1.jpg' },
];

export const GallerySection = () => {
  // show first 4 on mobile, all on larger screens
  const [visibleImages, setVisibleImages] = useState(4);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const check = () => {
      const mobile = typeof window !== 'undefined' ? window.innerWidth < 768 : true;
      setIsMobile(mobile);
      setVisibleImages(mobile ? Math.min(4, galleryImages.length) : galleryImages.length);
    };

    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const loadMore = () => {
    setLoading(true);
    setTimeout(() => {
      setVisibleImages((prev) => Math.min(prev + 2, galleryImages.length));
      setLoading(false);
    }, 800);
  };

  return (
    <section id="gallery" className="py-20 px-4 relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />

      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Section Title */}
        <h2 className="section-title font-display">GALLERY</h2>
        <div className="section-underline mb-8" />

        {/* Subtitle */}
        <p className="section-subtitle mb-12">
          <span className="text-primary">&gt;</span> Memories from previous
          Tesseracts
        </p>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {galleryImages.slice(0, visibleImages).map((image, index) => (
            <div
              key={image.id}
              className="gallery-image animate-fade-in bg-card overflow-hidden rounded-none relative"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <img
                src={image.src}
                alt={image.id}
                className="w-full h-56 md:h-48 lg:h-64 object-cover block rounded-none"
              />

              <div className="gallery-label absolute bottom-2 left-2 bg-background/60 px-2 py-1 rounded-sm">
                <span className="text-primary font-mono text-xs">{image.id}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button (mobile only) */}
        {isMobile && visibleImages < galleryImages.length && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="glass-card glow-button px-8 py-4 font-mono text-primary hover:border-primary/50 transition-all duration-300 disabled:opacity-50 rounded-none"
            >
              {loading ? (
                <span>
                  <span className="text-primary">&gt;</span> Loading
                  <span className="animate-blink">...</span>
                </span>
              ) : (
                <span>
                  <span className="text-primary">&gt;</span> More memories
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
