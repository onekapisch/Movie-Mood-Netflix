"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InfoIcon, GlobeIcon, RefreshCcw, Bookmark, BookmarkCheck, ThumbsUp, Star, Clock, Play, Share2, Check } from "lucide-react"
import Link from "next/link"
import { useWatchlist } from "@/hooks/use-watchlist"
import { useToast } from "@/hooks/use-toast"

interface RecommendationResultsProps {
  mood: string
  genres: string[]
  maxRuntime: number
  country: string
  serviceName: string
  providerId: number
  serviceKey: string
  sortBy: string
  minRating: number
  minVotes: number
  releaseWindow: string
  language: string
  watchWith?: string
  vibeUrl?: string
}

interface Movie {
  id: number
  title: string
  poster_path: string
  overview?: string
  vote_average: number
  popularity?: number
  runtime?: number
  release_date: string
  genre_ids: number[]
  imdb_id?: string
}

// Mood → preferred genre IDs (used for match % calculation)
const MOOD_GENRES: Record<string, number[]> = {
  happy:      [35, 10749, 16, 10751, 12, 10402],
  sad:        [18, 10749, 10402, 36, 9648],
  excited:    [28, 12, 878, 53, 80],
  relaxed:    [35, 99, 16, 10749, 10402],
  thoughtful: [18, 99, 36, 9648, 878],
  energetic:  [28, 12, 80, 53, 878, 27],
}

function calculateMatchScore(movie: Movie, mood: string, selectedGenres: string[]): number {
  const movieGenres = movie.genre_ids || []
  const moodPreferred = MOOD_GENRES[mood] || []

  // Genre overlap score (60% weight)
  let genreScore = 1
  if (selectedGenres.length > 0) {
    const selectedNums = selectedGenres.map(Number)
    const overlap = movieGenres.filter((g) => selectedNums.includes(g)).length
    genreScore = selectedNums.length > 0 ? Math.min(overlap / selectedNums.length, 1) : 1
  }

  // Mood alignment score (40% weight)
  let moodScore = 0.5
  if (moodPreferred.length > 0) {
    const moodOverlap = movieGenres.filter((g) => moodPreferred.includes(g)).length
    moodScore = Math.min(moodOverlap / Math.min(moodPreferred.length, 3), 1)
  }

  // Weighted raw score
  const raw = genreScore * 0.6 + moodScore * 0.4

  // Scale to 62–99 range (always appears positive but meaningful)
  return Math.round(62 + raw * 37)
}

function getTmdbSortBy(mood: string, sortBy: string): string {
  if (sortBy === "rating_desc") return "vote_average.desc"
  if (sortBy === "popularity_desc") return "popularity.desc"
  if (sortBy === "newest_desc") return "primary_release_date.desc"
  if (sortBy === "oldest_asc") return "primary_release_date.asc"

  if (mood === "happy" || mood === "excited") return "popularity.desc"
  if (mood === "sad" || mood === "thoughtful") return "vote_average.desc"
  return "vote_count.desc"
}

function getReleaseDateRange(releaseWindow: string): { gte?: string; lte?: string } {
  const y = new Date().getFullYear()
  if (releaseWindow === "last_3_years") return { gte: `${y - 3}-01-01` }
  if (releaseWindow === "last_10_years") return { gte: `${y - 10}-01-01` }
  if (releaseWindow === "classics") return { lte: "2000-12-31" }
  return {}
}

function sortClientSide(results: Movie[], sortBy: string): Movie[] {
  const list = [...results]
  if (sortBy === "rating_desc") return list.sort((a, b) => b.vote_average - a.vote_average)
  if (sortBy === "popularity_desc") return list.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
  if (sortBy === "newest_desc")
    return list.sort(
      (a, b) =>
        new Date(b.release_date || "1900-01-01").getTime() -
        new Date(a.release_date || "1900-01-01").getTime(),
    )
  if (sortBy === "oldest_asc")
    return list.sort(
      (a, b) =>
        new Date(a.release_date || "2100-01-01").getTime() -
        new Date(b.release_date || "2100-01-01").getTime(),
    )
  return list
}

export default function RecommendationResults({
  mood,
  genres,
  maxRuntime,
  country,
  serviceName,
  providerId,
  serviceKey,
  sortBy,
  minRating,
  minVotes,
  releaseWindow,
  language,
  watchWith,
  vibeUrl,
}: RecommendationResultsProps) {
  const [results, setResults] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, toggleLike, isLiked } = useWatchlist()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true)
        setError(null)

        const endpoint = "discover/movie"
        const params = new URLSearchParams()

        if (genres.length > 0) params.append("with_genres", genres.join(","))
        params.append("sort_by", getTmdbSortBy(mood, sortBy))
        if (minRating > 0) params.append("vote_average.gte", String(minRating))
        if (minVotes > 0) params.append("vote_count.gte", String(minVotes))

        const releaseRange = getReleaseDateRange(releaseWindow)
        if (releaseRange.gte) params.append("primary_release_date.gte", releaseRange.gte)
        if (releaseRange.lte) params.append("primary_release_date.lte", releaseRange.lte)
        if (language !== "any") params.append("with_original_language", language)

        params.append("region", country.toUpperCase())
        params.append("with_watch_providers", String(providerId))
        params.append("watch_monetization_types", "flatrate")
        params.append("watch_region", country.toUpperCase())

        const response = await fetch(`/api/tmdb?endpoint=${endpoint}&${params.toString()}`)
        const data = await response.json()

        if (!response.ok) throw new Error(data.status_message || data.error || "Failed to fetch")
        if (data.error) throw new Error(data.status_message || data.error)

        let pool = data.results || []

        // Fallback: remove provider filter if sparse
        if (pool.length === 0) {
          const fb = new URLSearchParams()
          if (genres.length > 0) fb.append("with_genres", genres.join(","))
          fb.append("sort_by", getTmdbSortBy(mood, sortBy))
          fb.append("region", country.toUpperCase())
          if (minRating > 0) fb.append("vote_average.gte", String(minRating))
          if (minVotes > 0) fb.append("vote_count.gte", String(minVotes))
          if (releaseRange.gte) fb.append("primary_release_date.gte", releaseRange.gte)
          if (releaseRange.lte) fb.append("primary_release_date.lte", releaseRange.lte)
          if (language !== "any") fb.append("with_original_language", language)

          const fbRes = await fetch(`/api/tmdb?endpoint=${endpoint}&${fb.toString()}`)
          if (fbRes.ok) {
            const fbData = await fbRes.json()
            pool = fbData.results || []
          }
        }

        if (pool.length === 0) {
          setResults([])
          return
        }

        // Fetch runtime for top 12 candidates
        const detailed = await Promise.all(
          pool.slice(0, 12).map(async (movie: Movie) => {
            try {
              const dr = await fetch(`/api/tmdb?endpoint=movie/${movie.id}`)
              if (!dr.ok) return movie
              const dd = await dr.json()
              return { ...movie, runtime: dd.runtime, imdb_id: dd.imdb_id }
            } catch {
              return movie
            }
          }),
        )

        const filtered = detailed.filter((m) => !m.runtime || m.runtime <= maxRuntime)
        setResults(sortClientSide(filtered, sortBy).slice(0, 6))
      } catch (err: any) {
        console.error("Error fetching recommendations:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [mood, genres, maxRuntime, country, providerId, retryCount, serviceKey, sortBy, minRating, minVotes, releaseWindow, language])

  const handleShare = () => {
    if (vibeUrl) {
      navigator.clipboard.writeText(vibeUrl).then(() => {
        setCopied(true)
        toast({ title: "Vibe link copied!", description: "Share it with a friend." })
        setTimeout(() => setCopied(false), 3000)
      })
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-4">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: "rgba(229,9,20,0.08)", border: "1px solid rgba(229,9,20,0.15)" }}
        >
          <div className="w-4 h-4 rounded-full border-2 border-netflix-red/30 border-t-netflix-red animate-spin" />
          <span className="text-sm text-white/60">Finding the best matches for you…</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="shimmer rounded-2xl animate-fade-in-up" style={{ height: 220 }} />
          ))}
        </div>
      </div>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <div
        className="text-center py-16 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <InfoIcon className="h-10 w-10 text-white/20 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Couldn&apos;t Find Recommendations</h3>
        <p className="text-white/40 mb-6 max-w-md mx-auto text-sm">{error}</p>
        <Button onClick={() => setRetryCount((c) => c + 1)} className="glow-button rounded-xl">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  // ── No results ──
  if (results.length === 0) {
    return (
      <div
        className="text-center py-16 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <InfoIcon className="h-10 w-10 text-white/20 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">
          No matches on {serviceName} {country.toUpperCase()}
        </h3>
        <p className="text-white/40 mb-6 max-w-md mx-auto text-sm">
          Try adjusting your preferences, picking another platform, or selecting a different country.
        </p>
        <Button onClick={() => setRetryCount((c) => c + 1)} className="glow-button rounded-xl">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  // ── Results ──
  return (
    <div className="space-y-6">
      {/* Results header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">
            Your{" "}
            <span className="gradient-text-red">{serviceName}</span>{" "}
            Picks
          </h2>
          <p className="text-sm text-white/40 mt-0.5">
            {results.length} titles matched your vibe in {country.toUpperCase()}
            {watchWith && watchWith !== "solo" && ` · Watching with ${watchWith}`}
          </p>
        </div>
        {vibeUrl && (
          <Button
            variant="outline"
            size="sm"
            className="glass-button rounded-lg gap-2 text-white/60 hover:text-white"
            onClick={handleShare}
          >
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Copied!" : "Share vibe"}
          </Button>
        )}
      </div>

      {/* Movie grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
        {results.map((movie) => {
          const match = calculateMatchScore(movie, mood, genres)
          const inList = isInWatchlist(movie.id)
          const liked = isLiked(movie.id)
          const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null

          return (
            <div
              key={movie.id}
              className="movie-card-premium group animate-fade-in-up"
            >
              <div className="flex flex-col sm:flex-row h-full">
                {/* Poster */}
                <div className="relative w-full sm:w-[140px] shrink-0 overflow-hidden rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none">
                  <div className="aspect-[2/3] sm:aspect-auto sm:h-full min-h-[180px]">
                    {movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <span className="text-3xl font-black text-white/10">{movie.title.charAt(0)}</span>
                      </div>
                    )}
                  </div>

                  {/* Match score */}
                  <div
                    className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white match-score-badge"
                  >
                    {match}% match
                  </div>

                  {/* Service badge */}
                  <div
                    className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(0,0,0,0.7)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <GlobeIcon className="h-3 w-3 text-netflix-red" />
                    <span className="text-[10px] text-white/70 font-medium">{serviceName}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 p-4 flex flex-col">
                  <Link href={`/movie/${movie.id}`} className="group/title">
                    <h3 className="font-bold text-white text-base leading-snug mb-2 group-hover/title:text-netflix-red transition-colors line-clamp-2">
                      {movie.title}
                    </h3>
                  </Link>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                    </div>
                    {movie.runtime && (
                      <div className="flex items-center gap-1 text-white/40">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs">{movie.runtime}m</span>
                      </div>
                    )}
                    {year && <span className="text-xs text-white/30">{year}</span>}
                  </div>

                  {/* Overview snippet */}
                  {movie.overview && (
                    <p className="text-xs text-white/40 leading-relaxed line-clamp-2 mb-3 flex-1">
                      {movie.overview}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-auto pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <Link href={`/movie/${movie.id}`} className="flex-1">
                      <Button
                        size="sm"
                        className="w-full glow-button rounded-lg gap-1.5 text-xs h-8"
                      >
                        <Play className="h-3.5 w-3.5 fill-white" />
                        Details
                      </Button>
                    </Link>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8 rounded-lg transition-all"
                      style={{
                        background: inList ? "rgba(229,9,20,0.15)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${inList ? "rgba(229,9,20,0.4)" : "rgba(255,255,255,0.08)"}`,
                      }}
                      onClick={() => {
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
                    >
                      {inList ? (
                        <BookmarkCheck className="h-3.5 w-3.5 text-netflix-red" />
                      ) : (
                        <Bookmark className="h-3.5 w-3.5 text-white/50" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8 rounded-lg transition-all"
                      style={{
                        background: liked ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${liked ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
                      }}
                      onClick={() => {
                        toggleLike(movie.id)
                        toast({
                          title: liked ? "Unliked" : "Liked!",
                          description: movie.title,
                        })
                      }}
                    >
                      <ThumbsUp
                        className="h-3.5 w-3.5"
                        style={{ color: liked ? "#818cf8" : "rgba(255,255,255,0.5)" }}
                      />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex justify-center pt-4">
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="glass-button rounded-xl gap-2 text-white/60"
            onClick={() => setRetryCount((c) => c + 1)}
          >
            <RefreshCcw className="h-4 w-4" />
            Different picks
          </Button>
          <Link href="/discover">
            <Button variant="outline" size="sm" className="glass-button rounded-xl text-white/60">
              Explore all movies
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
