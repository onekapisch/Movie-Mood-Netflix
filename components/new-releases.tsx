"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Film, Tv2, Star, Bookmark, BookmarkCheck, CalendarDays, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DEFAULT_COUNTRY, DEFAULT_SERVICE_KEY, getServiceByKey } from "@/lib/streaming-options"
import { useWatchlist } from "@/hooks/use-watchlist"
import { useToast } from "@/hooks/use-toast"

interface Release {
  id: number
  title?: string
  name?: string
  poster_path: string | null
  backdrop_path?: string | null
  vote_average: number
  release_date?: string
  first_air_date?: string
  genre_ids: number[]
  overview?: string
}

type ContentType = "movie" | "tv"

function timeAgo(dateStr: string): { label: string; isNew: boolean; isRecent: boolean } {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return { label: "Today", isNew: true, isRecent: true }
  if (days === 1) return { label: "Yesterday", isNew: true, isRecent: true }
  if (days < 14) return { label: `${days}d ago`, isNew: true, isRecent: true }
  if (days < 60) return { label: `${Math.round(days / 7)}w ago`, isNew: false, isRecent: true }
  const months = Math.round(days / 30)
  return { label: `${months}mo ago`, isNew: false, isRecent: false }
}

function getDateDaysAgo(n: number): string {
  return new Date(Date.now() - n * 864e5).toISOString().split("T")[0]
}

export default function NewReleases() {
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [contentType, setContentType] = useState<ContentType>("movie")
  const [country, setCountry] = useState(DEFAULT_COUNTRY)
  const [serviceName, setServiceName] = useState(getServiceByKey(DEFAULT_SERVICE_KEY).label)
  const [providerId, setProviderId] = useState(getServiceByKey(DEFAULT_SERVICE_KEY).providerId)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist()
  const { toast } = useToast()

  useEffect(() => {
    const handler = (event: Event) => {
      const e = event as CustomEvent<{ serviceName: string; providerId: number; country: string }>
      if (!e.detail) return
      setServiceName(e.detail.serviceName)
      setProviderId(e.detail.providerId)
      setCountry(e.detail.country)
    }
    window.addEventListener("streamingfilterschange", handler)

    const savedKey = localStorage.getItem("selectedStreamingService") || DEFAULT_SERVICE_KEY
    const svc = getServiceByKey(savedKey)
    const savedCountry =
      localStorage.getItem(`selectedCountry:${svc.key}`) || localStorage.getItem("selectedCountry")
    setServiceName(svc.label)
    setProviderId(svc.providerId)
    if (savedCountry) setCountry(savedCountry)

    return () => window.removeEventListener("streamingfilterschange", handler)
  }, [])

  useEffect(() => {
    async function fetchReleases() {
      setLoading(true)
      setReleases([])

      try {
        const isMovie = contentType === "movie"
        const endpoint = isMovie ? "discover/movie" : "discover/tv"
        const dateKey = isMovie ? "primary_release_date" : "first_air_date"
        const sortKey = isMovie ? "primary_release_date.desc" : "first_air_date.desc"

        const buildParams = (lookbackDays: number, withProvider: boolean) => {
          const p = new URLSearchParams({
            sort_by: sortKey,
            [`${dateKey}.gte`]: getDateDaysAgo(lookbackDays),
            [`${dateKey}.lte`]: getDateDaysAgo(0),
            watch_region: country.toUpperCase(),
            watch_monetization_types: "flatrate",
            "vote_count.gte": "5",
            include_adult: "false",
          })
          if (withProvider) p.set("with_watch_providers", String(providerId))
          return p
        }

        const window1 = isMovie ? 90 : 180
        let res = await fetch(`/api/tmdb?endpoint=${endpoint}&${buildParams(window1, true)}`)
        let data = res.ok ? await res.json() : { results: [] }
        let pool: Release[] = data?.results || []

        if (pool.length < 4) {
          res = await fetch(`/api/tmdb?endpoint=${endpoint}&${buildParams(365, true)}`)
          data = res.ok ? await res.json() : { results: [] }
          pool = data?.results || []
        }

        if (pool.length < 4) {
          const p = new URLSearchParams({
            sort_by: sortKey,
            watch_region: country.toUpperCase(),
            with_watch_providers: String(providerId),
            watch_monetization_types: "flatrate",
            "vote_count.gte": "5",
          })
          res = await fetch(`/api/tmdb?endpoint=${endpoint}&${p}`)
          data = res.ok ? await res.json() : { results: [] }
          pool = data?.results || []
        }

        setReleases(pool.slice(0, 12))
      } catch (err) {
        console.error("NewReleases fetch error:", err)
        setReleases([])
      } finally {
        setLoading(false)
      }
    }

    fetchReleases()
  }, [contentType, country, providerId])

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", updateScrollState, { passive: true })
    updateScrollState()
    return () => el.removeEventListener("scroll", updateScrollState)
  }, [releases, updateScrollState])

  const scrollBy = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 340 : -340, behavior: "smooth" })
  }

  const countryLabel = country.toUpperCase()

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Subtle ambient gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(229,9,20,0.04), transparent 70%)",
        }}
      />

      <div className="container px-4 relative">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-netflix-red" />
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-netflix-red/70">
                Just released
              </p>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              New on{" "}
              <span className="gradient-text-red">{serviceName}</span>
              <span className="text-lg font-normal ml-2" style={{ color: "var(--text-quaternary)" }}>
                {countryLabel}
              </span>
            </h2>
          </div>

          {/* Content type toggle + scroll arrows */}
          <div className="flex items-center gap-3">
            {/* Movies | TV toggle */}
            <div
              className="flex items-center rounded-xl p-1 gap-1"
              style={{
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
              }}
            >
              {(["movie", "tv"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setContentType(type)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    background: contentType === type ? "rgba(229,9,20,0.15)" : "transparent",
                    color: contentType === type ? "#E50914" : "var(--text-tertiary)",
                    border: contentType === type ? "1px solid rgba(229,9,20,0.3)" : "1px solid transparent",
                  }}
                >
                  {type === "movie" ? <Film className="h-3.5 w-3.5" /> : <Tv2 className="h-3.5 w-3.5" />}
                  {type === "movie" ? "Movies" : "TV Shows"}
                </button>
              ))}
            </div>

            {/* Scroll arrows — desktop only */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={() => scrollBy("left")}
                disabled={!canScrollLeft}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-25"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--text-secondary)",
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scrollBy("right")}
                disabled={!canScrollRight}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-25"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--text-secondary)",
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex gap-4 pb-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="shrink-0 rounded-xl shimmer animate-fade-in-up"
                style={{ width: 200, aspectRatio: "2/3", animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        )}

        {/* No results */}
        {!loading && releases.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-2xl text-center"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
            }}
          >
            {contentType === "movie" ? (
              <Film className="h-10 w-10 mb-3" style={{ color: "var(--text-quaternary)" }} />
            ) : (
              <Tv2 className="h-10 w-10 mb-3" style={{ color: "var(--text-quaternary)" }} />
            )}
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              No recent {contentType === "movie" ? "movies" : "TV shows"} found for {serviceName} in {countryLabel}.
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-quaternary)" }}>
              Try switching your country or streaming service.
            </p>
          </div>
        )}

        {/* Carousel */}
        {!loading && releases.length > 0 && (
          <div className="relative">
            {/* Left fade gradient */}
            <div
              className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none transition-opacity duration-300"
              style={{
                background: "linear-gradient(to right, var(--page-bg), transparent)",
                opacity: canScrollLeft ? 1 : 0,
              }}
            />
            {/* Right fade gradient */}
            <div
              className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none transition-opacity duration-300"
              style={{
                background: "linear-gradient(to left, var(--page-bg), transparent)",
                opacity: canScrollRight ? 1 : 0,
              }}
            />

            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {releases.map((item, index) => {
                const title = item.title || item.name || "Unknown"
                const dateStr = item.release_date || item.first_air_date || ""
                const mediaType = contentType
                const inList = isInWatchlist(item.id)
                const age = dateStr ? timeAgo(dateStr) : null
                const href = `/${mediaType}/${item.id}`

                return (
                  <ReleaseCard
                    key={item.id}
                    item={item}
                    title={title}
                    dateStr={dateStr}
                    age={age}
                    href={href}
                    inList={inList}
                    index={index}
                    onWatchlistToggle={() => {
                      if (inList) {
                        removeFromWatchlist(item.id)
                        toast({ title: "Removed from watchlist", description: title })
                      } else {
                        addToWatchlist({
                          id: item.id,
                          title,
                          poster_path: item.poster_path,
                          media_type: mediaType,
                          vote_average: item.vote_average,
                          release_date: dateStr,
                          genre_ids: item.genre_ids,
                        })
                        toast({ title: "Added to watchlist!", description: title })
                      }
                    }}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Accuracy note */}
        {!loading && releases.length > 0 && (
          <p className="text-[11px] mt-3 text-right" style={{ color: "var(--text-quaternary)" }}>
            Showing recently released titles available on {serviceName} · Data via TMDB
          </p>
        )}
      </div>
    </section>
  )
}

interface ReleaseCardProps {
  item: Release
  title: string
  dateStr: string
  age: { label: string; isNew: boolean; isRecent: boolean } | null
  href: string
  inList: boolean
  index: number
  onWatchlistToggle: () => void
}

function ReleaseCard({ item, title, dateStr, age, href, inList, index, onWatchlistToggle }: ReleaseCardProps) {
  const [hovered, setHovered] = useState(false)

  const newBadgeStyle = age?.isNew
    ? { background: "rgba(16,185,129,0.85)", border: "1px solid rgba(16,185,129,0.3)" }
    : age?.isRecent
      ? { background: "rgba(99,102,241,0.7)", border: "1px solid rgba(99,102,241,0.3)" }
      : { background: "rgba(100,100,100,0.6)", border: "1px solid rgba(100,100,100,0.3)" }

  return (
    <div
      className="shrink-0 group animate-fade-in-up"
      style={{ width: 200, scrollSnapAlign: "start", animationDelay: `${index * 50}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Poster */}
      <Link href={href}>
        <div
          className="relative rounded-xl overflow-hidden mb-3 transition-all duration-400"
          style={{
            aspectRatio: "2/3",
            border: "1px solid var(--glass-border)",
            boxShadow: hovered
              ? "0 16px 48px rgba(0,0,0,0.3), 0 0 30px rgba(229,9,20,0.08)"
              : "var(--glass-shadow)",
            transform: hovered ? "translateY(-4px) scale(1.02)" : "none",
          }}
        >
          {item.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "var(--glass-bg)" }}
            >
              <span className="text-4xl font-black" style={{ color: "var(--text-quaternary)" }}>
                {title.charAt(0)}
              </span>
            </div>
          )}

          {/* Gradient overlay on hover */}
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              opacity: hovered ? 1 : 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 50%, transparent 100%)",
            }}
          />

          {/* NEW badge — top left */}
          {age && (
            <div
              className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
              style={newBadgeStyle}
            >
              {age.label}
            </div>
          )}

          {/* Rating — top right */}
          {item.vote_average > 0 && (
            <div
              className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full"
              style={{
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] font-bold text-white">{item.vote_average.toFixed(1)}</span>
            </div>
          )}

          {/* Watchlist button — bottom right, shows on hover */}
          <button
            onClick={(e) => {
              e.preventDefault()
              onWatchlistToggle()
            }}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              opacity: hovered ? 1 : 0,
              transform: hovered ? "scale(1)" : "scale(0.8)",
              background: inList ? "rgba(229,9,20,0.85)" : "rgba(0,0,0,0.7)",
              border: "1px solid rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
            }}
          >
            {inList ? (
              <BookmarkCheck className="h-4 w-4 text-white" />
            ) : (
              <Bookmark className="h-4 w-4 text-white" />
            )}
          </button>

          {/* Overview snippet — shows on hover */}
          {item.overview && (
            <div
              className="absolute bottom-0 left-0 right-0 p-3 transition-opacity duration-300"
              style={{ opacity: hovered ? 1 : 0 }}
            >
              <p className="text-[10px] text-white/70 line-clamp-3 leading-relaxed">{item.overview}</p>
            </div>
          )}
        </div>
      </Link>

      {/* Info below poster */}
      <div className="space-y-1 px-0.5">
        <Link href={href}>
          <h3
            className="text-sm font-semibold leading-tight line-clamp-2 transition-colors"
            style={{ minHeight: "2.5rem", color: "var(--text-secondary)" }}
          >
            {title}
          </h3>
        </Link>

        {dateStr && (
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3" style={{ color: "var(--text-quaternary)" }} />
            <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              {new Date(dateStr).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
