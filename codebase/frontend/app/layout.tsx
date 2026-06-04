import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import ThemeToggle from "./ThemeToggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Personal Finance",
  description: "Thu chi thông minh",
};

const COINS = [
  { left: "3%",  delay: 0,   duration: 8  },
  { left: "9%",  delay: 3.2, duration: 11 },
  { left: "16%", delay: 1.5, duration: 9  },
  { left: "22%", delay: 5.8, duration: 13 },
  { left: "29%", delay: 0.7, duration: 7  },
  { left: "36%", delay: 4.1, duration: 10 },
  { left: "44%", delay: 2.3, duration: 12 },
  { left: "51%", delay: 6.9, duration: 8  },
  { left: "58%", delay: 1.1, duration: 14 },
  { left: "65%", delay: 3.7, duration: 9  },
  { left: "72%", delay: 7.4, duration: 11 },
  { left: "79%", delay: 2.6, duration: 7  },
  { left: "86%", delay: 5.2, duration: 13 },
  { left: "93%", delay: 0.4, duration: 10 },
];

const SPARKLES = [
  { left: "6%",  top: "10%", delay: 0,   duration: 2.8 },
  { left: "19%", top: "32%", delay: 1.2, duration: 3.5 },
  { left: "31%", top: "68%", delay: 0.4, duration: 2.2 },
  { left: "44%", top: "18%", delay: 2.1, duration: 3.8 },
  { left: "57%", top: "78%", delay: 1.6, duration: 2.5 },
  { left: "66%", top: "42%", delay: 0.9, duration: 3.1 },
  { left: "75%", top: "14%", delay: 2.7, duration: 4.2 },
  { left: "83%", top: "58%", delay: 0.2, duration: 2.8 },
  { left: "91%", top: "28%", delay: 1.9, duration: 3.4 },
  { left: "11%", top: "82%", delay: 3.1, duration: 2.1 },
  { left: "38%", top: "88%", delay: 0.7, duration: 3.7 },
  { left: "52%", top: "48%", delay: 2.4, duration: 2.6 },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const enableToolbar =
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_ENABLE_TOOLBAR === "true";

  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com" />
        {/* Apply saved theme before paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('finance-theme') || 'dark';
            document.documentElement.setAttribute('data-theme', t);
          } catch(e) {}
        `}} />
        {enableToolbar && (
          <script src="https://encore.dev/encore-toolbar.js" />
        )}
      </head>
      <body className={inter.className}>

        <div className="particles">
          {COINS.map((c, i) => (
            <div
              key={`coin-${i}`}
              className="coin"
              style={{
                left: c.left,
                animationDuration: `${c.duration}s`,
                animationDelay: `-${c.delay}s`,
              }}
            />
          ))}
          {SPARKLES.map((s, i) => (
            <div
              key={`sparkle-${i}`}
              className="sparkle"
              style={{
                left: s.left,
                top: s.top,
                animationDuration: `${s.duration}s`,
                animationDelay: `${s.delay}s`,
              }}
            >
              ✦
            </div>
          ))}
        </div>

        <header style={{
          background: "var(--header-bg)",
          borderBottom: "1px solid var(--header-border)",
          position: "relative",
          zIndex: 10,
          transition: "background 0.4s ease",
        }}>
          <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{
                  background: "var(--logo-bg)",
                  boxShadow: "var(--logo-shadow)",
                  transition: "background 0.4s ease, box-shadow 0.4s ease",
                }}
              >
                💰
              </div>
              <div>
                <p className="brand-text font-extrabold text-base leading-tight tracking-tight">
                  Personal Finance
                </p>
                <p className="text-xs leading-tight" style={{ color: "var(--tagline-color)" }}>
                  Thu chi thông minh
                </p>
              </div>
            </div>

            <nav className="flex items-center gap-2">
              <a
                href="/finance"
                className="px-4 py-1.5 rounded-lg text-sm font-medium"
                style={{ color: "var(--nav-color)", border: "1px solid var(--nav-border)" }}
              >
                Dashboard
              </a>
              <ThemeToggle />
            </nav>
          </div>
        </header>

        <div style={{ position: "relative", zIndex: 10 }}>
          <Providers>{children}</Providers>
        </div>

      </body>
    </html>
  );
}
