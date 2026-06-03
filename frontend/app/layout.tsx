import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Personal Finance",
  description: "Income & expense tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://encore.dev/encore-toolbar.js"></script>
      </head>
      <body className={inter.className}>
        <nav className="bg-white border-b">
          <div className="container mx-auto px-4 flex items-center gap-6 h-12 text-sm font-medium text-gray-600">
            <a href="/finance" className="hover:text-indigo-600">Finance</a>
          </div>
        </nav>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
