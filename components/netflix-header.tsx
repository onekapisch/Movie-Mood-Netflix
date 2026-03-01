"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, Menu, X, Bookmark } from "lucide-react"
import CountrySelector from "./country-selector"
import ThemeToggle from "./theme-toggle"
import { useWatchlist } from "@/hooks/use-watchlist"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { watchlistCount } = useWatchlist()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "var(--nav-bg)" : "transparent",
        backdropFilter: scrolled ? "blur(40px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(40px)" : "none",
        borderBottom: scrolled ? "1px solid var(--nav-border)" : "1px solid transparent",
        boxShadow: scrolled ? "var(--glass-shadow)" : "none",
      }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span
            className="font-extrabold text-xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Movie<span className="gradient-text-red">Mood</span>
          </span>
          <span
            className="px-2 py-0.5 text-xs font-semibold rounded-full tracking-wide"
            style={{
              background: "rgba(229,9,20,0.12)",
              border: "1px solid rgba(229,9,20,0.25)",
              color: "#E50914",
            }}
          >
            by Kapisch
          </span>
        </Link>

        {/* Service + Country Selector */}
        <div className="hidden md:flex flex-1 justify-center max-w-sm">
          <CountrySelector />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: "/", label: "Home" },
            { href: "/discover", label: "Discover" },
            { href: "/recommendations", label: "Recommendations" },
          ].map(({ href, label }) => (
            <Link key={href} href={href}>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg text-sm font-medium transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                {label}
              </Button>
            </Link>
          ))}
          <Link href="/watchlist">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-sm relative gap-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              <Bookmark className="h-3.5 w-3.5" />
              Watchlist
              {watchlistCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                  style={{ background: "#E50914", boxShadow: "0 0 8px rgba(229,9,20,0.6)" }}
                >
                  {watchlistCount > 9 ? "9+" : watchlistCount}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/search">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg w-9 h-9"
              style={{ color: "var(--text-secondary)" }}
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </Link>
          <ThemeToggle />
        </nav>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex items-center gap-1.5 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-lg"
            style={{ color: "var(--text-secondary)" }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div
          className="md:hidden border-t"
          style={{
            background: "var(--nav-bg)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            borderColor: "var(--nav-border)",
          }}
        >
          <div className="container px-4 py-4 space-y-4">
            <CountrySelector />
            <nav className="flex flex-col gap-1">
              {[
                { href: "/", label: "Home" },
                { href: "/discover", label: "Discover" },
                { href: "/recommendations", label: "Recommendations" },
                { href: "/watchlist", label: "My Watchlist" },
                { href: "/search", label: "Search" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
