import type { Metadata } from "next"
import { Inter, Cormorant_Garamond, IBM_Plex_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth/auth-context"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ArchaFlow - Architecture Project Management",
  description: "Professional architecture project management SaaS platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Inline script to prevent flash of wrong theme/accent/density on load
  const themeScript = `
    (function() {
      try {
        var d = document.documentElement;
        var pref = localStorage.getItem('archaflow-theme') || 'system';
        var isDark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) d.classList.add('dark');
        else d.classList.remove('dark');
        var accent = localStorage.getItem('archaflow-accent');
        if (accent && accent !== 'amber') d.dataset.accent = accent;
        var density = localStorage.getItem('archaflow-density');
        if (density && density !== 'default') d.dataset.density = density;
      } catch(e) {}
    })();
  `

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} ${cormorant.variable} ${ibmPlexMono.variable}`}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
