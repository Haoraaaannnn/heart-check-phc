'use client';
import { useState, useEffect } from 'react';

export function ElapsedTimer({
  startedAt,
  warnAfterSeconds = 120,
}: {
  startedAt?: string | null;
  warnAfterSeconds?: number;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const isLong = elapsed >= warnAfterSeconds;

  return (
    <span className={`text-xs font-mono tabular-nums font-semibold ${isLong ? 'text-red-500' : 'text-green-500'}`}>
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  );
}