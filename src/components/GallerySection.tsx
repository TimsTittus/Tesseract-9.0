import { useState } from 'react';

const galleryImages = [
  { id: 'IMG_01', placeholder: true },
  { id: 'IMG_02', placeholder: true },
  { id: 'IMG_03', placeholder: true },
  { id: 'IMG_04', placeholder: true },
  { id: 'IMG_05', placeholder: true },
  { id: 'IMG_06', placeholder: true },
];

export const GallerySection = () => {
  const [visibleImages, setVisibleImages] = useState(4);
  const [loading, setLoading] = useState(false);

  const loadMore = () => {
    setLoading(true);
    setTimeout(() => {
      setVisibleImages((prev) => Math.min(prev + 2, galleryImages.length));
      setLoading(false);
    }, 1000);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {galleryImages.slice(0, visibleImages).map((image, index) => (
            <div
              key={image.id}
              className="gallery-image animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Placeholder */}
              <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
                <span className="text-muted-foreground font-mono text-sm">
                  Loading...
                </span>
              </div>

              {/* Image Label */}
              <div className="gallery-label">
                <span className="text-primary font-mono text-sm">
                  {image.id}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {visibleImages < galleryImages.length && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="glass-card glow-button px-8 py-4 font-mono text-primary hover:border-primary/50 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <span>
                  <span className="text-primary">&gt;</span> Loading
                  <span className="animate-blink">...</span>
                </span>
              ) : (
                <span>
                  <span className="text-primary">&gt;</span> More memories
                  loading
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
