'use client';

import { useState, useEffect, useRef } from 'react';

export function useTimer(duration, active, onExpire) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (!active) {
      clearInterval(intervalRef.current);
      return;
    }
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        onExpire?.();
      }
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [active, duration, onExpire]);

  return timeLeft;
}
