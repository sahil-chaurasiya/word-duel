'use client';

import { useState, useEffect, useRef } from 'react';

const SIZE = 52;
const R = 22;
const CIRCUM = 2 * Math.PI * R;

export default function TimerRing({ duration = 10, active }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    setTimeLeft(duration);
    if (!active) return;
    startRef.current = performance.now();
    function tick(now) {
      const elapsed = (now - startRef.current) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);
      if (remaining > 0) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, duration]);

  const pct = active ? timeLeft / duration : 0;
  const offset = CIRCUM * (1 - pct);
  const danger = timeLeft <= 3 && active;
  const displayTime = Math.ceil(timeLeft);

  return (
    <div className="timer-ring-container">
      <svg className="timer-ring" width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle className="timer-ring-bg" cx={SIZE / 2} cy={SIZE / 2} r={R} strokeWidth={4} />
        <circle
          className={`timer-ring-fill ${danger ? 'danger' : ''}`}
          cx={SIZE / 2} cy={SIZE / 2} r={R} strokeWidth={4}
          strokeDasharray={CIRCUM}
          strokeDashoffset={active ? offset : CIRCUM}
          style={{ transition: active ? 'stroke-dashoffset 0.1s linear' : 'none' }}
        />
      </svg>
      <div className={`timer-text ${danger ? 'danger' : ''}`}>
        {active ? displayTime : '—'}
      </div>
    </div>
  );
}
