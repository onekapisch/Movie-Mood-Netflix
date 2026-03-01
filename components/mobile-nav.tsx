"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, Bookmark, Search, Sparkles } from "lucide-react"
import { useWatchlist } from "@/hooks/use-watchlist"

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/recommendations", icon: Sparkles, label: "Mood" },
  { href: "/watchlist", icon: Bookmark, label: "Watchlist", showCount: true },
  { href: "/search", icon: Search, label: "Search" },
]

export default function MobileNav() {
  const pathname = usePathname()
  const { watchlistCount } = useWatchlist()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bottom-nav"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label, showCount }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))
          const count = showCount ? watchlistCount : 0

          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 touch-target justify-center"
              style={{
                minWidth: 56,
                color: isActive ? "#E50914" : "var(--text-tertiary)",
                background: isActive ? "rgba(229,9,20,0.08)" : "transparent",
              }}
            >
              <div className="relative">
                <Icon
                  className="h-5 w-5 transition-transform duration-200"
                  style={{ transform: isActive ? "scale(1.1)" : "scale(1)" }}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {count > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                    style={{ background: "#E50914", boxShadow: "0 0 6px rgba(229,9,20,0.6)" }}
                  >
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </div>
              <span
                className="text-[10px] font-medium leading-none"
                style={{ color: isActive ? "#E50914" : "var(--text-tertiary)" }}
              >
                {label}
              </span>
              {isActive && (
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: "#E50914" }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
