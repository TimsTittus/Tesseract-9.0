export const TesseractLogo = ({ className = '' }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Hexagon */}
      <path
        d="M50 5L90 27.5V72.5L50 95L10 72.5V27.5L50 5Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {/* Inner Hexagon */}
      <path
        d="M50 20L75 35V65L50 80L25 65V35L50 20Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {/* Connecting Lines */}
      <line x1="50" y1="5" x2="50" y2="20" stroke="currentColor" strokeWidth="2" />
      <line x1="90" y1="27.5" x2="75" y2="35" stroke="currentColor" strokeWidth="2" />
      <line x1="90" y1="72.5" x2="75" y2="65" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="95" x2="50" y2="80" stroke="currentColor" strokeWidth="2" />
      <line x1="10" y1="72.5" x2="25" y2="65" stroke="currentColor" strokeWidth="2" />
      <line x1="10" y1="27.5" x2="25" y2="35" stroke="currentColor" strokeWidth="2" />
      {/* T9 Text */}
      <text
        x="50"
        y="52"
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-display text-sm"
        fill="currentColor"
        fontSize="14"
        fontWeight="bold"
      >
        T9
      </text>
    </svg>
  );
};
