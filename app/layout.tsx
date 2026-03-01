import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "MovieMood by Kapisch",
    template: "%s | MovieMood",
  },
  description:
    "Discover the perfect movie for your mood on Netflix, Prime, Disney+ and more. Mood-based film discovery across 30 countries.",
  keywords: [
    "movie recommendations",
    "mood-based movies",
    "Netflix recommendations",
    "what to watch",
    "film discovery",
    "streaming movies",
  ],
  authors: [{ name: "Kapisch" }],
  creator: "Kapisch",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "MovieMood by Kapisch",
    description: "Find the perfect movie for your mood — available on your streaming service right now.",
    siteName: "MovieMood",
  },
  twitter: {
    card: "summary_large_image",
    title: "MovieMood by Kapisch",
    description: "Find the perfect movie for your mood — available on your streaming service right now.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MovieMood",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F4F8" },
    { media: "(prefers-color-scheme: dark)", color: "#050508" },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
