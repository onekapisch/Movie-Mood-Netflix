"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InfoIcon, GlobeIcon, RefreshCcw } from "lucide-react"
import Link from "next/link"

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
}

interface Movie {
  id: number
  title: string
  poster_path: string
  vote_average: number
  popularity?: number
  runtime?: number
  release_date: string
  genre_ids: number[]
  imdb_id?: string
}

function getTmdbSortBy(mood: string, sortBy: string): string {
  if (sortBy === "rating_desc") return "vote_average.desc"
  if (sortBy === "popularity_desc") return "popularity.desc"
  if (sortBy === "newest_desc") return "primary_release_date.desc"
  if (sortBy === "oldest_asc") return "primary_release_date.asc"

  // Default "best_match" behavior falls back to mood-aware sorting.
  if (mood === "happy" || mood === "excited") return "popularity.desc"
  if (mood === "sad" || mood === "thoughtful") return "vote_average.desc"
  return "vote_count.desc"
}

function getReleaseDateRange(releaseWindow: string): { gte?: string; lte?: string } {
  const currentYear = new Date().getFullYear()

  if (releaseWindow === "last_3_years") {
    return { gte: `${currentYear - 3}-01-01` }
  }

  if (releaseWindow === "last_10_years") {
    return { gte: `${currentYear - 10}-01-01` }
  }

  if (releaseWindow === "classics") {
    return { lte: "2000-12-31" }
  }

  return {}
}

function sortClientSideResults(results: Movie[], sortBy: string): Movie[] {
  const list = [...results]

  if (sortBy === "rating_desc") {
    return list.sort((a, b) => b.vote_average - a.vote_average)
  }

  if (sortBy === "popularity_desc") {
    return list.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
  }

  if (sortBy === "newest_desc") {
    return list.sort((a, b) => new Date(b.release_date || "1900-01-01").getTime() - new Date(a.release_date || "1900-01-01").getTime())
  }

  if (sortBy === "oldest_asc") {
    return list.sort((a, b) => new Date(a.release_date || "2100-01-01").getTime() - new Date(b.release_date || "2100-01-01").getTime())
  }

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
}: RecommendationResultsProps) {
  const [results, setResults] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true)
        setError(null)

        // Get genre-based recommendations
        const endpoint = "discover/movie"
        const params = new URLSearchParams()

        // Add genres if selected
        if (genres.length > 0) {
          params.append("with_genres", genres.join(","))
        }

        params.append("sort_by", getTmdbSortBy(mood, sortBy))

        if (minRating > 0) {
          params.append("vote_average.gte", String(minRating))
        }

        if (minVotes > 0) {
          params.append("vote_count.gte", String(minVotes))
        }

        const releaseRange = getReleaseDateRange(releaseWindow)
        if (releaseRange.gte) {
          params.append("primary_release_date.gte", releaseRange.gte)
        }
        if (releaseRange.lte) {
          params.append("primary_release_date.lte", releaseRange.lte)
        }

        if (language !== "any") {
          params.append("with_original_language", language)
        }

        // Add country parameter for regional availability.
        params.append("region", country.toUpperCase())

        // Filter results by selected streaming service.
        params.append("with_watch_providers", String(providerId))
        params.append("watch_monetization_types", "flatrate")
        params.append("watch_region", country.toUpperCase())

        const response = await fetch(`/api/tmdb?endpoint=${endpoint}&${params.toString()}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.status_message || data.error || "Failed to fetch recommendations")
        }

        if (data.error) {
          throw new Error(data.status_message || data.error)
        }

        // If no results, try a more general search
        if (!data.results || data.results.length === 0) {
          // Try without the watch provider filter
          const fallbackParams = new URLSearchParams()
          if (genres.length > 0) {
            fallbackParams.append("with_genres", genres.join(","))
          }
          fallbackParams.append("sort_by", getTmdbSortBy(mood, sortBy))
          fallbackParams.append("region", country.toUpperCase())

          if (minRating > 0) {
            fallbackParams.append("vote_average.gte", String(minRating))
          }
          if (minVotes > 0) {
            fallbackParams.append("vote_count.gte", String(minVotes))
          }

          if (releaseRange.gte) {
            fallbackParams.append("primary_release_date.gte", releaseRange.gte)
          }
          if (releaseRange.lte) {
            fallbackParams.append("primary_release_date.lte", releaseRange.lte)
          }

          if (language !== "any") {
            fallbackParams.append("with_original_language", language)
          }

          const fallbackResponse = await fetch(`/api/tmdb?endpoint=${endpoint}&${fallbackParams.toString()}`)
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            if (fallbackData.results && fallbackData.results.length > 0) {
              // Get detailed info for each movie
              const detailedMoviesPromises = fallbackData.results.slice(0, 12).map(async (movie: Movie) => {
                try {
                  const detailResponse = await fetch(`/api/tmdb?endpoint=movie/${movie.id}`)
                  if (!detailResponse.ok) {
                    return movie
                  }
                  const detailData = await detailResponse.json()
                  return {
                    ...movie,
                    runtime: detailData.runtime,
                    imdb_id: detailData.imdb_id,
                  }
                } catch (error) {
                  return movie
                }
              })

              const detailedMovies = await Promise.all(detailedMoviesPromises)
              const filteredResults = detailedMovies.filter((movie) => !movie.runtime || movie.runtime <= maxRuntime)
              setResults(sortClientSideResults(filteredResults, sortBy).slice(0, 6))
              return
            }
          }

          setResults([])
          return
        }

        // Get detailed info for each movie
        const detailedMoviesPromises = data.results.slice(0, 12).map(async (movie: Movie) => {
          try {
            const detailResponse = await fetch(`/api/tmdb?endpoint=movie/${movie.id}`)
            if (!detailResponse.ok) {
              return movie
            }
            const detailData = await detailResponse.json()
            return {
              ...movie,
              runtime: detailData.runtime,
              imdb_id: detailData.imdb_id,
            }
          } catch (error) {
            return movie
          }
        })

        const detailedMovies = await Promise.all(detailedMoviesPromises)
        const filteredResults = detailedMovies.filter((movie) => !movie.runtime || movie.runtime <= maxRuntime)
        setResults(sortClientSideResults(filteredResults, sortBy).slice(0, 6))
      } catch (err: any) {
        console.error("Error fetching recommendations:", err)
        setError(err.message)
        // Don't show toast for errors, just handle them gracefully
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [
    mood,
    genres,
    maxRuntime,
    country,
    providerId,
    retryCount,
    serviceKey,
    sortBy,
    minRating,
    minVotes,
    releaseWindow,
    language,
  ])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border">
            <CardContent className="p-0">
              <div className="flex">
                <div className="w-1/3 aspect-[2/3] bg-muted animate-pulse"></div>
                <div className="w-2/3 p-4 space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded-md"></div>
                  <div className="h-3 bg-muted animate-pulse rounded-md w-1/2"></div>
                  <div className="h-10 bg-muted animate-pulse rounded-md"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border p-6">
        <InfoIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Couldn't Find Recommendations</h3>
        <p className="text-muted-foreground mb-6">
          {error}
        </p>
        <Button onClick={handleRetry} className="bg-netflix-red hover:bg-netflix-red/90">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border p-6">
        <InfoIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">
          No Matches Found on {serviceName} {country.toUpperCase()}
        </h3>
        <p className="text-muted-foreground mb-6">
          We couldn't find movies matching your criteria on {serviceName} in your selected country. Try adjusting your
          preferences, picking another platform, or selecting a different country.
        </p>
        <Button onClick={handleRetry} className="bg-netflix-red hover:bg-netflix-red/90">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Personalized {serviceName} Recommendations</h2>
      <p className="text-muted-foreground">
        These movies are available on <span className="font-medium">{serviceName}</span> in{" "}
        <span className="font-medium">{country.toUpperCase()}</span> and match your mood and preferences.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((movie) => (
          <Link key={movie.id} href={`/movie/${movie.id}`}>
            <Card className="border overflow-hidden h-full card-hover">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row h-full">
                  <div className="w-full md:w-2/5 aspect-[2/3] overflow-hidden relative">
                    {movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                        alt={movie.title}
                        className="w-full h-full object-cover image-hover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-2xl font-bold text-muted-foreground">{movie.title.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-netflix-red text-white">
                        <GlobeIcon className="h-3 w-3 mr-1" />
                        {serviceName}
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full md:w-3/5 p-4 flex flex-col">
                    <h3 className="font-bold text-lg mb-1">{movie.title}</h3>
                    <div className="flex items-center mb-2">
                      <div className="imdb-rating mr-2">TMDB {movie.vote_average.toFixed(1)}</div>
                      {movie.runtime && (
                        <Badge variant="outline" className="text-xs">
                          {movie.runtime} min
                        </Badge>
                      )}
                    </div>
                    <div className="mt-auto">
                      <Badge className="bg-netflix-red/20 text-netflix-red border-0">Perfect for your mood</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <Link href="/discover">
          <Button variant="outline">Explore More Movies</Button>
        </Link>
      </div>
    </div>
  )
}
