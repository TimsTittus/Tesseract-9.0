export const PixelArtScene = () => {
  const src = '/pixel-mountains-%20and-%20stuff.png';

  return (
    <div className="w-full overflow-hidden">
      <div className="relative w-full" style={{ paddingTop: '15%' }}>
        <img
          src={src}
          alt="Pixel mountains"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  );
};
