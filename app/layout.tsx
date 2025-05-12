import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { SessionProvider } from "@/lib/SessionContext";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next Level - Micro-apprenticeship Platform",
  description: "Connect with local short-term opportunities and earn skill badges",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen text-foreground antialiased`}>
        {/* Global free-flowing background */}
        <div
          aria-hidden
          className="fixed inset-0 -z-10 w-full h-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 60% 0%, rgba(200, 80, 0, 0.16) 0%, rgba(200, 80, 0, 0.07) 30%, rgba(24,24,24,0.98) 80%, #111 100%), ' +
              'linear-gradient(120deg, #181818 0%, #181818 100%)',
            minHeight: '100vh',
            width: '100vw',
            maxWidth: '100%',
            left: 0,
            top: 0,
            zIndex: -10,
          }}
        >
          {/* Subtle orange grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(#c85000 1px, transparent 1px), linear-gradient(to right, #c85000 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              minHeight: '100vh',
              width: '100vw',
              maxWidth: '100%',
              left: 0,
              top: 0,
              pointerEvents: 'none',
            }}
          />
        </div>
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
