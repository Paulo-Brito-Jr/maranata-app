"use client";

import { useEffect, useState } from "react";

export function TempoDecorrido({ desde }: { desde: string }) {
  const [min, setMin] = useState<number | null>(null);
  useEffect(() => {
    const calc = () => {
      const ms = Date.now() - new Date(desde).getTime();
      setMin(Math.max(0, Math.floor(ms / 60000)));
    };
    calc();
    const t = window.setInterval(calc, 60_000);
    return () => window.clearInterval(t);
  }, [desde]);
  if (min === null) return null;
  return <span>{min}min</span>;
}
