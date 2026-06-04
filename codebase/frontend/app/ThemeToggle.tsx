"use client";

import { useEffect, useState } from "react";

const Coin = ({ active }: { active: boolean }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "22px",
      height: "22px",
      borderRadius: "50%",
      fontSize: "11px",
      fontWeight: "900",
      flexShrink: 0,
      background: active
        ? "radial-gradient(circle at 35% 30%, #fff9c0, #ffd700 40%, #e8a000 72%, #b8860b)"
        : "rgba(255,255,255,0.1)",
      border: active
        ? "1.5px solid rgba(255,235,100,0.85)"
        : "1.5px solid rgba(255,255,255,0.18)",
      boxShadow: active
        ? "0 0 8px rgba(255,215,0,0.75), inset 0 1px 2px rgba(255,255,255,0.45)"
        : "none",
      color: active ? "#7a4f00" : "rgba(255,255,255,0.3)",
      transition: "all 0.35s ease",
    }}
  >
    $
  </span>
);

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("finance-theme");
    const dark = saved !== "light";
    setIsDark(dark);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, []);

  const setTheme = (dark: boolean) => {
    setIsDark(dark);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("finance-theme", dark ? "dark" : "light");
  };

  return (
    <div
      role="group"
      aria-label="Theme switcher"
      className="relative flex items-center rounded-full p-1"
      style={{
        width: "152px",
        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.10)",
        border: `1px solid ${isDark ? "rgba(255,215,0,0.28)" : "rgba(255,255,255,0.45)"}`,
        transition: "background 0.4s ease, border-color 0.4s ease",
      }}
    >
      {/* Sliding pill */}
      <span
        aria-hidden
        className="absolute top-1 rounded-full"
        style={{
          width: "70px",
          height: "calc(100% - 8px)",
          left: "4px",
          background: isDark
            ? "linear-gradient(135deg, #ffd700, #e8a000)"
            : "rgba(255,255,255,0.95)",
          boxShadow: isDark
            ? "0 0 14px rgba(255,215,0,0.7), 0 2px 6px rgba(0,0,0,0.25)"
            : "0 2px 10px rgba(0,0,0,0.18)",
          transform: isDark ? "translateX(72px)" : "translateX(0px)",
          transition: [
            "transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)",
            "background 0.35s ease",
            "box-shadow 0.35s ease",
          ].join(", "),
        }}
      />

      {/* Day button */}
      <button
        onClick={() => setTheme(false)}
        className="relative z-10 flex items-center justify-center gap-1.5 rounded-full select-none"
        style={{
          width: "70px",
          height: "28px",
          color: !isDark ? "#3730a3" : "rgba(255,255,255,0.38)",
          fontSize: "12px",
          fontWeight: 600,
          transition: "color 0.3s ease",
        }}
      >
        <Coin active={!isDark} />
        <span>Day</span>
      </button>

      {/* Night button */}
      <button
        onClick={() => setTheme(true)}
        className="relative z-10 flex items-center justify-center gap-1.5 rounded-full select-none"
        style={{
          width: "70px",
          height: "28px",
          color: isDark ? "#1a0a3d" : "rgba(255,255,255,0.38)",
          fontSize: "12px",
          fontWeight: 600,
          transition: "color 0.3s ease",
        }}
      >
        <Coin active={isDark} />
        <span>Night</span>
      </button>
    </div>
  );
}
