"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, RefreshCcw, Star, Bookmark, BookmarkCheck } from "lucide-react"
import Link from "next/link"
import { DEFAULT_COUNTRY, DEFAULT_SERVICE_KEY, getServiceByKey } from "@/lib/streaming-options"
import { useWatchlist } from "@/hooks/use-watchlist"
import { useToast } from "@/hooks/use-toast"

interface Movie {
  id: number
  title: string
  poster_path: string
  vote_average: number
  release_date?: string
  genre_ids?: number[]
}

export default function FeaturedMovies() {
  const [trending, setTrending] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [country, setCountry] = useState(DEFAULT_COUNTRY)
  const [serviceName, setServiceName] = useState(getServiceByKey(DEFAULT_SERVICE_KEY).label)
  const [providerId, setProviderId] = useState(getServiceByKey(DEFAULT_SERVICE_KEY).providerId)
  const [retryCount, setRetryCount] = useState(0)
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist()
  const { toast } = useToast()

  useEffect(() => {
    const handleStreamingFiltersChange = (event: Event) => {
      const customEvent = event as CustomEvent<{
        serviceName: string
        providerId: number
        country: string
      }>
      if (!customEvent.detail) return
      setServiceName(customEvent.detail.serviceName)
      setProviderId(customEvent.detail.providerId)
      setCountry(customEvent.detail.country)
    }

    window.addEventListener("streamingfilterschange", handleStreamingFiltersChange)

    const savedServiceKey = localStorage.getItem("selectedStreamingService") || DEFAULT_SERVICE_KEY
    const savedService = getServiceByKey(savedServiceKey)
    const savedCountry =
      localStorage.getItem(`selectedCountry:${savedService.key}`) || localStorage.getItem("selectedCountry")

    setServiceName(savedService.label)
    setProviderId(savedService.providerId)
    if (savedCountry) setCountry(savedCountry)

    return () => window.removeEventListener("streamingfilterschange", handleStreamingFiltersChange)
  }, [])

  useEffect(() => {
    async function fetchTrending() {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          sort_by: "popularity.desc",
          watch_region: country.toUpperCase(),
          with_watch_providers: String(providerId),
          watch_monetization_types: "flatrate",
          include_adult: "false",
          "vote_count.gte": "50",
        })

        const response = await fetch(`/api/tmdb?endpoint=discover/movie&${params.toString()}`)
        if (!response.ok) throw new Error("Failed to fetch")

        const data = await response.json()
        if (data.error) throw new Error(data.error)

        if (data.results && data.results.length > 0) {
          setTrending(data.results.slice(0, 6))
          return
        }

        const fb = await fetch(`/api/tmdb?endpoint=trending/movie/week&region=${country.toUpperCase()}`)
        if (!fb.ok) { setTrending([]); return }
        const fbData = await fb.json()
        setTrending(fbData.results?.slice(0, 6) || [])
      } catch (err: any) {
        console.error("Error fetching trending movies:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTrending()
  }, [country, providerId, retryCount])

  if (loading) {
    return (
      <section className="py-20">
        <div className="container px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="shimmer h-4 w-24 rounded mb-2" />
              <div className="shimmer h-8 w-48 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="shimmer aspect-[2/3] rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-20">
        <div className="container px-4">
          <div
            className="p-8 rounded-2xl text-center"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
              Unable to load trending movies.
            </p>
            <Button
              onClick={() => setRetryCount((c) => c + 1)}
              variant="outline"
              size="sm"
              className="glass-button rounded-xl"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </section>
    )
  }

  if (trending.length === 0) return null

  return (
    <section className="py-20 relative">
      <div className="section-divider mb-0" />

      <div className="container px-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-netflix-red/60 mb-2">
              Trending now
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold" style={{ color: "var(--text-primary)" }}>
              Popular on{" "}
              <span className="gradient-text-red">{serviceName}</span>
            </h2>
          </div>
          <Link href="/discover">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 rounded-lg"
              style={{ color: "var(--text-tertiary)" }}
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
          {trending.map((movie) => {
            const inList = isInWatchlist(movie.id)
            return (
              <div key={movie.id} className="group relative animate-fade-in-up">
                <Link href={`/movie/${movie.id}`}>
                  <div
                    className="aspect-[2/3] rounded-xl overflow-hidden transition-all duration-400 group-hover:scale-[1.04]"
                    style={{
                      border: "1px solid var(--glass-border)",
                      boxShadow: "var(--glass-shadow)",
                    }}
                  >
                    {movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: "var(--glass-bg)" }}
                      >
                        <span className="text-2xl font-black" style={{ color: "var(--text-quaternary)" }}>
                          {movie.title.charAt(0)}
                        </span>
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div
                      className="absolute inset-0 rounded-xl flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                      </div>
                      <p className="text-xs font-semibold text-white leading-tight line-clamp-2">{movie.title}</p>
                    </div>
                  </div>
                </Link>

                {/* Watchlist toggle */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    if (inList) {
                      removeFromWatchlist(movie.id)
                      toast({ title: "Removed from watchlist", description: movie.title })
                    } else {
                      addToWatchlist({
                        id: movie.id,
                        title: movie.title,
                        poster_path: movie.poster_path,
                        media_type: "movie",
                        vote_average: movie.vote_average,
                        release_date: movie.release_date,
                        genre_ids: movie.genre_ids,
                      })
                      toast({ title: "Added to watchlist!", description: movie.title })
                    }
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                  style={{
                    background: inList ? "rgba(229,9,20,0.85)" : "rgba(0,0,0,0.7)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {inList ? (
                    <BookmarkCheck className="h-3.5 w-3.5 text-white" />
                  ) : (
                    <Bookmark className="h-3.5 w-3.5 text-white" />
                  )}
                </button>

                {/* Title below poster */}
                <div className="mt-2 px-0.5">
                  <p
                    className="text-sm font-medium truncate transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {movie.title}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="h-3 w-3 text-yellow-400/60 fill-yellow-400/60" />
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {movie.vote_average.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
