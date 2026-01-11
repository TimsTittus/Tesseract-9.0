import { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const TARGET_DATE = new Date('2026-01-31T00:00:00');

import { useNavigate } from 'react-router-dom';

export const Countdown = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = TARGET_DATE.getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const timeBlocks = [
    { value: timeLeft.days, label: 'DAYS' },
    { value: timeLeft.hours, label: 'HOURS' },
    { value: timeLeft.minutes, label: 'MINS' },
    { value: timeLeft.seconds, label: 'SECS' },
  ];

  return (
    <div className="flex flex-col items-center gap-12 w-full max-w-5xl mx-auto px-4">
      {/* Date and Register Section */}
      <div className="flex flex-row items-center justify-center w-full gap-4 md:gap-12">
        {/* Left Date */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] md:text-2xl text-primary font-display tracking-widest mb-1 md:mb-2">JANUARY</span>
          <div className="flex gap-1">
            <div className="bg-primary text-background p-1 md:p-2 rounded w-8 h-12 md:w-24 md:h-32 flex items-center justify-center">
              <span className="text-2xl md:text-8xl font-bold font-display">3</span>
            </div>
            <div className="bg-primary text-background p-1 md:p-2 rounded w-8 h-12 md:w-24 md:h-32 flex items-center justify-center">
              <span className="text-2xl md:text-8xl font-bold font-display">1</span>
            </div>
          </div>
        </div>

        {/* Register Button */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-primary rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <button
            onClick={() => navigate('/register')}
            className="relative glow-button bg-primary text-background px-3 py-2 md:px-8 md:py-4 text-xs md:text-2xl font-bold font-display tracking-wider rounded-lg hover:scale-105 transition-transform flex items-center gap-2 whitespace-nowrap"
          >
            REGISTER NOW
          </button>
          {/* Pixel Art Invader Decoration */}
          {/* <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-primary opacity-80 animate-bounce hidden md:block">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 18h2v-2h2v-2h2v-2h2v-2h4v2h2v2h2v2h2v2h2v2h-2v-2h-2v-2h-2v-2h-2v-2h-4v2h-2v2h-2v2h-2v2H2v-2zm4-12h2v2h-2V6zm12 0h2v2h-2V6z" />
            </svg>
          </div> */}
        </div>

        {/* Right Date */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] md:text-2xl text-primary font-display tracking-widest mb-1 md:mb-2">FEBRUARY</span>
          <div className="flex gap-1">
            <div className="bg-primary text-background p-1 md:p-2 rounded w-8 h-12 md:w-24 md:h-32 flex items-center justify-center">
              <span className="text-2xl md:text-8xl font-bold font-display">0</span>
            </div>
            <div className="bg-primary text-background p-1 md:p-2 rounded w-8 h-12 md:w-24 md:h-32 flex items-center justify-center">
              <span className="text-2xl md:text-8xl font-bold font-display">1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Timer */}
      <div className="flex gap-4 md:gap-8 justify-center flex-wrap w-full">
        {timeBlocks.map((block, index) => (
          <div key={block.label} className="countdown-box glow-border">
            <span className="countdown-number font-display">
              {formatNumber(block.value)}
            </span>
            <span className="countdown-label">{block.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
