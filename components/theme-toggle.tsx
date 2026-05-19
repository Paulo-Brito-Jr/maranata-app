"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    window.setTimeout(() => setMounted(true), 0);
  }, []);
  if (!mounted) {
    return <span className="inline-block size-8 rounded-full bg-white/10" aria-hidden />;
  }

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Modo claro" : "Modo escuro"}
      className="inline-flex size-8 items-center justify-center rounded-full bg-white/20 text-base transition hover:bg-white/30"
    >
      {isDark ? "☼" : "☾"}
    </button>
  );
}
