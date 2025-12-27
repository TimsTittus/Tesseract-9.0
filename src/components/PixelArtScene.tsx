export const PixelArtScene = () => {
  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox="0 0 800 120"
        className="w-full h-auto"
        preserveAspectRatio="xMidYMax slice"
      >
        <g fill="hsl(83 100% 62%)" className="animate-float" style={{ animationDelay: '0s' }}>
          <rect x="30" y="30" width="8" height="8" />
          <rect x="54" y="30" width="8" height="8" />
          <rect x="38" y="38" width="8" height="8" />
          <rect x="46" y="38" width="8" height="8" />
          <rect x="22" y="46" width="40" height="8" />
          <rect x="22" y="54" width="8" height="8" />
          <rect x="30" y="54" width="24" height="8" />
          <rect x="54" y="54" width="8" height="8" />
          <rect x="22" y="62" width="8" height="8" />
          <rect x="38" y="62" width="8" height="8" />
          <rect x="54" y="62" width="8" height="8" />
          <rect x="30" y="70" width="8" height="8" />
          <rect x="54" y="70" width="8" height="8" />
        </g>

        <g fill="hsl(83 100% 62%)">
          {/* Left mountains */}
          <polygon points="0,120 40,80 80,120" />
          <polygon points="60,120 100,70 140,120" />
          <polygon points="120,120 160,85 200,120" />
          
          {/* Middle plateau with details */}
          <rect x="200" y="100" width="150" height="20" />
          <rect x="220" y="90" width="20" height="10" />
          <rect x="280" y="85" width="30" height="15" />
          <rect x="300" y="80" width="10" height="5" />
          
          {/* Satellite dish */}
          <rect x="380" y="70" width="4" height="50" />
          <ellipse cx="382" cy="65" rx="20" ry="10" fill="none" stroke="hsl(83 100% 62%)" strokeWidth="3" />
          
          {/* Planet/Moon */}
          <circle cx="460" cy="90" r="25" fill="hsl(83 100% 62% / 0.3)" stroke="hsl(83 100% 62%)" strokeWidth="2" />
          <path d="M440 85 Q460 95 480 85" fill="none" stroke="hsl(83 100% 62%)" strokeWidth="2" />
          
          {/* Right terrain */}
          <polygon points="500,120 540,90 580,120" />
          <polygon points="560,120 610,75 660,120" />
          <polygon points="640,120 700,85 760,120" />
          <polygon points="740,120 780,95 800,100 800,120" />
          
          {/* Small details */}
          <rect x="520" y="105" width="15" height="15" />
          <rect x="700" y="100" width="25" height="20" />
          <rect x="710" y="90" width="10" height="10" />
        </g>

        {/* Space Invader Right */}
        <g fill="hsl(83 100% 62%)" className="animate-float" style={{ animationDelay: '1s' }}>
          <rect x="720" y="20" width="6" height="6" />
          <rect x="738" y="20" width="6" height="6" />
          <rect x="714" y="26" width="6" height="6" />
          <rect x="744" y="26" width="6" height="6" />
          <rect x="714" y="32" width="36" height="6" />
          <rect x="708" y="38" width="12" height="6" />
          <rect x="726" y="38" width="12" height="6" />
          <rect x="744" y="38" width="12" height="6" />
          <rect x="714" y="44" width="36" height="6" />
          <rect x="720" y="50" width="6" height="6" />
          <rect x="738" y="50" width="6" height="6" />
          <rect x="714" y="56" width="6" height="6" />
          <rect x="744" y="56" width="6" height="6" />
        </g>
      </svg>
    </div>
  );
};
