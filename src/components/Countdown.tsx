import { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const TARGET_DATE = new Date('2026-01-31T00:00:00');

export const Countdown = () => {
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
    <div className="flex gap-2 md:gap-4 justify-center flex-wrap">
      {timeBlocks.map((block, index) => (
        <div key={block.label} className="countdown-box glow-border">
          <span className="countdown-number font-display">
            {formatNumber(block.value)}
          </span>
          <span className="countdown-label">{block.label}</span>
        </div>
      ))}
    </div>
  );
};
