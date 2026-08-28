import { useState, useEffect } from 'react';

export function useRelativeTime(date) {
  const [now, setNow] = useState(null);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (!date || now == null) return 'just now';

  const seconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));

  if (seconds < 2) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}
