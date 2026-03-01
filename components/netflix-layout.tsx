import type { ReactNode } from "react"
import Header from "./netflix-header"
import MobileNav from "./mobile-nav"
import { ThemeProvider } from "@/components/theme-provider"

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <div
        className="min-h-screen text-foreground transition-colors duration-300"
        style={{ background: "var(--page-bg)" }}
      >
        <Header />
        <main className="pt-16 has-bottom-nav md:pb-0">{children}</main>
        <MobileNav />
      </div>
    </ThemeProvider>
  )
}
