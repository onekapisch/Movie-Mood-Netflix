"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  ClockIcon,
  CalendarIcon,
  PlayCircleIcon,
  UserIcon,
  CheckIcon,
  XIcon,
  RefreshCcw,
  Bookmark,
  BookmarkCheck,
  ThumbsUp,
  Star,
  Sparkles,
  Brain,
  Eye,
  AlertTriangle,
  Film,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useWatchlist } from "@/hooks/use-watchlist"
import Link from "next/link"
import { DEFAULT_COUNTRY, DEFAULT_SERVICE_KEY, getServiceByKey } from "@/lib/streaming-options"

interface MovieDetailProps {
  id: string
  mediaType?: "movie" | "tv"
}

interface AiAnalysis {
  mood: string[]
  themes: string[]
  similarContent: string[]
  viewingContext: string[]
  contentWarnings: string[]
  analysis: string
}

export default function MovieDetail({ id, mediaType = "movie" }: MovieDetailProps) {
  const [movie, setMovie] = useState<any>(null)
  const [similar, setSimilar] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [country, setCountry] = useState(DEFAULT_COUNTRY)
  const [selectedServiceName, setSelectedServiceName] = useState(getServiceByKey(DEFAULT_SERVICE_KEY).label)
  const [selectedProviderId, setSelectedProviderId] = useState(getServiceByKey(DEFAULT_SERVICE_KEY).providerId)
  const [isAvailableOnService, setIsAvailableOnService] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const { toast } = useToast()
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, toggleLike, isLiked } = useWatchlist()

  useEffect(() => {
    const handleStreamingFiltersChange = (event: Event) => {
      const customEvent = event as CustomEvent<{
        serviceName: string
        providerId: number
        country: string
      }>
      if (!customEvent.detail) return
      setSelectedServiceName(customEvent.detail.serviceName)
      setSelectedProviderId(customEvent.detail.providerId)
      setCountry(customEvent.detail.country)
    }

    window.addEventListener("streamingfilterschange", handleStreamingFiltersChange)

    const savedServiceKey = localStorage.getItem("selectedStreamingService") || DEFAULT_SERVICE_KEY
    const savedService = getServiceByKey(savedServiceKey)
    const savedCountry =
      localStorage.getItem(`selectedCountry:${savedService.key}`) || localStorage.getItem("selectedCountry")

    setSelectedServiceName(savedService.label)
    setSelectedProviderId(savedService.providerId)
    if (savedCountry) setCountry(savedCountry)

    return () => window.removeEventListener("streamingfilterschange", handleStreamingFiltersChange)
  }, [])

  useEffect(() => {
    async function fetchMovie() {
      try {
        setLoading(true)
        setError(null)

        const detailsResponse = await fetch(
          `/api/tmdb?endpoint=${mediaType}/${id}&append_to_response=credits,videos,watch/providers`,
        )

        if (!detailsResponse.ok) throw new Error("Failed to fetch movie details")

        const movieData = await detailsResponse.json()
        if (movieData.error) throw new Error(movieData.error)
        if (!movieData.id) throw new Error("Movie not found")

        setMovie(movieData)

        const watchProviders = movieData["watch/providers"]?.results?.[country]?.flatrate || []
        setIsAvailableOnService(watchProviders.some((p: any) => p.provider_id === selectedProviderId))

        const similarResponse = await fetch(`/api/tmdb?endpoint=${mediaType}/${id}/similar`)
        if (similarResponse.ok) {
          const similarData = await similarResponse.json()
          setSimilar(similarData.results?.slice(0, 6) || [])
        }
      } catch (error: any) {
        console.error("Error fetching movie details:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMovie()
  }, [country, id, mediaType, retryCount, selectedProviderId])

  // Fetch AI analysis after movie data is loaded
  useEffect(() => {
    if (!movie || aiAnalysis) return

    async function fetchAiAnalysis() {
      try {
        setAiLoading(true)
        setAiError(null)

        const res = await fetch("/api/analyze-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            movieId: movie.id,
            title: movie.title || movie.name || "",
            overview: movie.overview || "",
            genres: (movie.genres || []).map((g: any) => g.name),
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          if (err.error === "OPENAI_API_KEY_MISSING") {
            setAiError("AI analysis not configured")
          } else if (err.error === "RATE_LIMITED") {
            setAiError("Rate limited — try again later")
          } else {
            setAiError("Analysis unavailable")
          }
          return
        }

        const data = await res.json()
        setAiAnalysis(data.analysis)
      } catch {
        setAiError("Analysis unavailable")
      } finally {
        setAiLoading(false)
      }
    }

    fetchAiAnalysis()
  }, [movie])

  const movieId = Number(id)
  const inWatchlist = isInWatchlist(movieId)
  const liked = isLiked(movieId)

  const handleWatchlistToggle = () => {
    if (!movie) return
    const title = movie.title || movie.name || "Unknown"
    if (inWatchlist) {
      removeFromWatchlist(movieId)
      toast({ title: "Removed from watchlist", description: title })
    } else {
      addToWatchlist({
        id: movieId,
        title,
        poster_path: movie.poster_path || null,
        media_type: mediaType,
        vote_average: movie.vote_average || 0,
        release_date: movie.release_date || movie.first_air_date,
        genre_ids: (movie.genres || []).map((g: any) => g.id),
      })
      toast({ title: "Added to watchlist!", description: title })
    }
  }

  const handleLikeToggle = () => {
    if (!movie) return
    toggleLike(movieId)
    toast({
      title: liked ? "Removed like" : "Liked!",
      description: movie.title || movie.name,
    })
  }

  if (loading) {
    return (
      <div className="pt-16">
        <div className="h-[50vh] relative overflow-hidden">
          <Skeleton className="absolute inset-0 rounded-none" />
        </div>
        <div className="container px-4 -mt-32 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Skeleton className="aspect-[2/3] rounded-2xl" />
            <div className="md:col-span-2 space-y-4 pt-4">
              <Skeleton className="h-10 w-3/4 rounded-xl" />
              <Skeleton className="h-6 w-1/2 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-32 rounded-xl" />
                <Skeleton className="h-10 w-32 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="pt-24 min-h-screen">
        <div className="container px-4 py-12">
          <div
            className="rounded-2xl p-8 text-center max-w-md mx-auto"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <Film className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">Movie Not Found</h2>
            <p className="text-white/40 mb-6 text-sm">Sorry, we couldn&apos;t find this title.</p>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => window.history.back()}
                className="glass-button rounded-xl text-white/70"
                variant="outline"
              >
                Go Back
              </Button>
              <Button
                variant="outline"
                className="glass-button rounded-xl text-white/70"
                onClick={() => setRetryCount((c) => c + 1)}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const trailer = movie.videos?.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube")
  const title = movie.title || movie.name || "Unknown Title"
  const releaseDate = movie.release_date || movie.first_air_date
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : "N/A"
  const runtime = movie.runtime || movie.episode_run_time?.[0]
  const director = movie.credits?.crew?.find((p: any) => p.job === "Director")
  const creator = movie.created_by?.[0]
  const creatorName = mediaType === "tv" ? creator?.name : director?.name
  const creatorLabel = mediaType === "tv" ? "Creator" : "Director"
  const topCast = movie.credits?.cast?.slice(0, 5) || []
  const allProviders = movie["watch/providers"]?.results?.[country]

  return (
    <div className="pt-16 min-h-screen" style={{ background: "#050508" }}>
      {/* Backdrop */}
      <div className="relative h-[55vh] overflow-hidden">
        {movie.backdrop_path ? (
          <>
            <img
              src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
              alt={title}
              className="w-full h-full object-cover"
              style={{ opacity: 0.35 }}
            />
            <div className="absolute inset-0 netflix-gradient" />
            {/* Side fade */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(5,5,8,0.6) 0%, transparent 40%, transparent 60%, rgba(5,5,8,0.4) 100%)",
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, rgba(229,9,20,0.08), rgba(5,5,8,1))",
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="container px-4 -mt-48 relative z-10 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Poster column */}
          <div className="space-y-4">
            {/* Poster */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                boxShadow: "0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07)",
              }}
            >
              {movie.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  alt={title}
                  className="w-full"
                />
              ) : (
                <div
                  className="aspect-[2/3] flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <span className="text-4xl font-black text-white/10">{title.charAt(0)}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleWatchlistToggle}
                className="w-full rounded-xl gap-2 font-semibold transition-all"
                style={{
                  background: inWatchlist ? "rgba(229,9,20,0.15)" : undefined,
                  border: inWatchlist ? "1px solid rgba(229,9,20,0.35)" : undefined,
                }}
              >
                {inWatchlist ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 text-netflix-red" />
                    <span className="text-netflix-red">Saved</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" />
                    Watchlist
                  </>
                )}
              </Button>
              {trailer ? (
                <a href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full gap-2 glass-button rounded-xl">
                    <PlayCircleIcon className="h-4 w-4" />
                    Trailer
                  </Button>
                </a>
              ) : (
                <Button
                  variant="outline"
                  className="w-full gap-2 glass-button rounded-xl"
                  onClick={handleLikeToggle}
                  style={{
                    background: liked ? "rgba(99,102,241,0.12)" : undefined,
                    borderColor: liked ? "rgba(99,102,241,0.35)" : undefined,
                  }}
                >
                  <ThumbsUp className="h-4 w-4" style={{ color: liked ? "#818cf8" : undefined }} />
                  {liked ? "Liked" : "Like"}
                </Button>
              )}
            </div>

            {/* Stats panel */}
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/40">Rating</span>
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-white">{movie.vote_average?.toFixed(1)}</span>
                  <span className="text-white/25 text-xs">/ 10</span>
                </div>
              </div>

              {runtime && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/40">Runtime</span>
                  <div className="flex items-center gap-1.5">
                    <ClockIcon className="h-4 w-4 text-white/30" />
                    <span className="font-medium text-white">{runtime} min</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-sm">
                <span className="text-white/40">Released</span>
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4 text-white/30" />
                  <span className="font-medium text-white">{releaseYear}</span>
                </div>
              </div>

              <div
                className="flex justify-between items-center text-sm pt-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="text-white/40">
                  {selectedServiceName} ({country.toUpperCase()})
                </span>
                <div className="flex items-center gap-1.5">
                  {isAvailableOnService ? (
                    <>
                      <CheckIcon className="h-4 w-4 text-green-400" />
                      <span className="font-medium text-green-400 text-xs">Available</span>
                    </>
                  ) : (
                    <>
                      <XIcon className="h-4 w-4 text-white/30" />
                      <span className="font-medium text-white/30 text-xs">Not available</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* All streaming providers */}
            {allProviders && (
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <p className="text-xs text-white/30 font-medium mb-3 uppercase tracking-wider">
                  Stream in {country.toUpperCase()}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(allProviders.flatrate || []).map((provider: any) => (
                    <div
                      key={provider.provider_id}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                      title={provider.provider_name}
                    >
                      {provider.logo_path && (
                        <img
                          src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                          alt={provider.provider_name}
                          className="w-5 h-5 rounded"
                        />
                      )}
                      <span className="text-xs text-white/60">{provider.provider_name}</span>
                    </div>
                  ))}
                  {!(allProviders.flatrate?.length) && (
                    <span className="text-xs text-white/25">No streaming options found</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Details column */}
          <div className="md:col-span-2 space-y-8">
            {/* Title + genres */}
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2 netflix-title">
                {title}
              </h1>
              {movie.tagline && (
                <p className="text-white/40 italic text-sm mb-4">{movie.tagline}</p>
              )}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre: any) => (
                    <Badge
                      key={genre.id}
                      className="rounded-full text-white/60 border-white/10 bg-transparent"
                      variant="outline"
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Overview */}
            <div>
              <h2 className="text-lg font-bold text-white mb-3">Overview</h2>
              <p className="text-white/55 leading-relaxed">{movie.overview}</p>
            </div>

            {/* AI Analysis Section */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div
                className="flex items-center gap-3 px-5 py-4"
                style={{
                  background: "rgba(229,9,20,0.06)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(229,9,20,0.15)" }}
                >
                  <Sparkles className="h-4 w-4 text-netflix-red" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">AI Mood Analysis</h3>
                  <p className="text-xs text-white/35">Powered by GPT-4o</p>
                </div>
              </div>

              <div className="p-5">
                {aiLoading && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white/40 text-sm mb-4">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-netflix-red animate-spin" />
                      Analyzing the film&apos;s mood and themes…
                    </div>
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="shimmer h-4 rounded-lg" style={{ width: `${70 + i * 10}%` }} />
                    ))}
                  </div>
                )}

                {aiError && !aiLoading && (
                  <p className="text-white/25 text-sm italic">{aiError}</p>
                )}

                {aiAnalysis && !aiLoading && (
                  <div className="space-y-5">
                    {/* Analysis paragraph */}
                    {aiAnalysis.analysis && (
                      <p className="text-white/55 text-sm leading-relaxed">{aiAnalysis.analysis}</p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Mood */}
                      {aiAnalysis.mood?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Brain className="h-3.5 w-3.5 text-netflix-red" />
                            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Mood</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {aiAnalysis.mood.map((m) => (
                              <span
                                key={m}
                                className="text-xs px-2.5 py-1 rounded-full text-white/70 font-medium"
                                style={{ background: "rgba(229,9,20,0.1)", border: "1px solid rgba(229,9,20,0.2)" }}
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Viewing context */}
                      {aiAnalysis.viewingContext?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Eye className="h-3.5 w-3.5 text-blue-400" />
                            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                              Best watched
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {aiAnalysis.viewingContext.map((ctx) => (
                              <span
                                key={ctx}
                                className="text-xs px-2.5 py-1 rounded-full text-white/70"
                                style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.15)" }}
                              >
                                {ctx}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Themes */}
                      {aiAnalysis.themes?.length > 0 && (
                        <div className="sm:col-span-2">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Film className="h-3.5 w-3.5 text-purple-400" />
                            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Themes</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {aiAnalysis.themes.map((t) => (
                              <span
                                key={t}
                                className="text-xs px-2.5 py-1 rounded-full text-white/60"
                                style={{
                                  background: "rgba(167,139,250,0.08)",
                                  border: "1px solid rgba(167,139,250,0.15)",
                                }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Content warnings */}
                      {aiAnalysis.contentWarnings?.length > 0 && (
                        <div className="sm:col-span-2">
                          <div className="flex items-center gap-1.5 mb-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
                            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                              Content notes
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {aiAnalysis.contentWarnings.map((w) => (
                              <span
                                key={w}
                                className="text-xs px-2.5 py-1 rounded-full text-white/50"
                                style={{
                                  background: "rgba(245,158,11,0.07)",
                                  border: "1px solid rgba(245,158,11,0.15)",
                                }}
                              >
                                {w}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cast */}
            {topCast.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4">Cast</h2>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                  {topCast.map((person: any) => (
                    <div key={person.id} className="text-center">
                      {person.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                          alt={person.name}
                          className="w-full aspect-square object-cover rounded-xl mb-2"
                          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                        />
                      ) : (
                        <div
                          className="w-full aspect-square rounded-xl flex items-center justify-center mb-2"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                        >
                          <UserIcon className="h-7 w-7 text-white/15" />
                        </div>
                      )}
                      <p className="font-semibold text-xs text-white truncate">{person.name}</p>
                      <p className="text-[10px] text-white/35 truncate">{person.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {creatorName && (
              <div>
                <h2 className="text-lg font-bold text-white mb-2">{creatorLabel}</h2>
                <p className="text-white/55">{creatorName}</p>
              </div>
            )}

            {/* Similar */}
            {similar.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4">You Might Also Like</h2>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {similar.map((m) => (
                    <Link key={m.id} href={`/${mediaType}/${m.id}`}>
                      <div className="group/card">
                        <div
                          className="aspect-[2/3] overflow-hidden rounded-xl mb-2 transition-all duration-300 group-hover/card:scale-[1.03]"
                          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                        >
                          {m.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w342${m.poster_path}`}
                              alt={m.title || m.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{ background: "rgba(255,255,255,0.04)" }}
                            >
                              <span className="text-white/15 font-black text-xl">
                                {(m.title || m.name).charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium text-white/60 truncate group-hover/card:text-white transition-colors">
                          {m.title || m.name}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
