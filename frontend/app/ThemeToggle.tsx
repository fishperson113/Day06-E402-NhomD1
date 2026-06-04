"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("finance-theme");
    const dark = saved !== "light";
    setIsDark(dark);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("finance-theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
      style={{
        border: "1px solid var(--nav-border)",
        color: "var(--nav-color)",
        background: "rgba(255,255,255,0.08)",
      }}
      aria-label="Toggle theme"
    >
      <span>{isDark ? "☀️" : "🌙"}</span>
      <span>{isDark ? "Day" : "Night"}</span>
    </button>
  );
}
