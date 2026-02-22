"use client"

import { useState, useEffect, useRef } from "react"
import Layout from "@/components/netflix-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Globe } from "lucide-react"
import { DEFAULT_COUNTRY, DEFAULT_SERVICE_KEY, getCountryByCode, getServiceByKey } from "@/lib/streaming-options"

const genres = [
  { id: "28", name: "Action" },
  { id: "12", name: "Adventure" },
  { id: "16", name: "Animation" },
  { id: "35", name: "Comedy" },
  { id: "80", name: "Crime" },
  { id: "99", name: "Documentary" },
  { id: "18", name: "Drama" },
  { id: "10751", name: "Family" },
  { id: "14", name: "Fantasy" },
  { id: "36", name: "History" },
  { id: "27", name: "Horror" },
  { id: "10402", name: "Music" },
  { id: "9648", name: "Mystery" },
  { id: "10749", name: "Romance" },
  { id: "878", name: "Science Fiction" },
  { id: "53", name: "Thriller" },
]

interface Movie {
  id: number
  title: string
  poster_path: string
  vote_average: number
  release_date: string
}

export default function DiscoverPageClient() {
  const [activeTab, setActiveTab] = useState<string>("trending")
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [country, setCountry] = useState(DEFAULT_COUNTRY)
  const [serviceName, setServiceName] = useState(getServiceByKey(DEFAULT_SERVICE_KEY).label)
  const [providerId, setProviderId] = useState(getServiceByKey(DEFAULT_SERVICE_KEY).providerId)
  const [settingsUpdated, setSettingsUpdated] = useState(false)
  const settingsToastTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const handleStreamingFiltersChange = (
      event: Event,
    ) => {
      const customEvent = event as CustomEvent<{
        serviceName: string
        providerId: number
        country: string
        reason?: "init" | "user"
      }>

      if (!customEvent.detail) {
        return
      }

      setServiceName(customEvent.detail.serviceName)
      setProviderId(customEvent.detail.providerId)
      setCountry(customEvent.detail.country)

      if (customEvent.detail.reason === "user") {
        setSettingsUpdated(true)
        if (settingsToastTimeoutRef.current) {
          window.clearTimeout(settingsToastTimeoutRef.current)
        }
        settingsToastTimeoutRef.current = window.setTimeout(() => {
          setSettingsUpdated(false)
        }, 2200)
      }
    }

    window.addEventListener("streamingfilterschange", handleStreamingFiltersChange)

    const savedServiceKey = localStorage.getItem("selectedStreamingService") || DEFAULT_SERVICE_KEY
    const savedService = getServiceByKey(savedServiceKey)
    const savedCountry =
      localStorage.getItem(`selectedCountry:${savedService.key}`) || localStorage.getItem("selectedCountry")

    setServiceName(savedService.label)
    setProviderId(savedService.providerId)
    if (savedCountry) {
      setCountry(savedCountry)
    }

    return () => {
      window.removeEventListener("streamingfilterschange", handleStreamingFiltersChange)
      if (settingsToastTimeoutRef.current) {
        window.clearTimeout(settingsToastTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    async function fetchMovies() {
      setLoading(true)
      setError(null)
      try {
        const endpoint = "discover/movie"
        const params = new URLSearchParams()
        const currentDate = new Date().toISOString().slice(0, 10)

        params.set("include_adult", "false")
        params.set("region", country.toUpperCase())
        params.set("watch_region", country.toUpperCase())
        params.set("with_watch_providers", String(providerId))
        params.set("watch_monetization_types", "flatrate")

        if (activeTab === "popular") {
          params.set("sort_by", "popularity.desc")
          params.set("vote_count.gte", "300")
        } else if (activeTab === "top_rated") {
          params.set("sort_by", "vote_average.desc")
          params.set("vote_count.gte", "500")
        } else if (activeTab === "upcoming") {
          params.set("sort_by", "primary_release_date.asc")
          params.set("primary_release_date.gte", currentDate)
          params.set("vote_count.gte", "10")
        } else if (activeTab.startsWith("genre_")) {
          const genreId = activeTab.replace("genre_", "")
          params.set("sort_by", "popularity.desc")
          params.set("vote_count.gte", "50")
          params.set("with_genres", genreId)
        } else {
          // "Trending" within the selected provider/country.
          params.set("sort_by", "popularity.desc")
          params.set("vote_count.gte", "100")
        }

        const query = params.toString()
        const response = await fetch(`/api/tmdb?endpoint=${endpoint}${query ? `&${query}` : ""}`)
        const data = await response.json()

        if (!response.ok || data.error) {
          throw new Error(data.status_message || data.error || "Failed to load discover movies")
        }

        if (data.results?.length) {
          setMovies(data.results)
          return
        }

        // Fallback: if provider-specific catalog is sparse, keep the selected country and relax the provider filter.
        const fallbackParams = new URLSearchParams(params)
        fallbackParams.delete("with_watch_providers")
        fallbackParams.delete("watch_monetization_types")
        fallbackParams.delete("watch_region")

        const fallbackResponse = await fetch(`/api/tmdb?endpoint=${endpoint}&${fallbackParams.toString()}`)
        const fallbackData = await fallbackResponse.json()

        if (!fallbackResponse.ok || fallbackData.error) {
          throw new Error(fallbackData.status_message || fallbackData.error || "Failed to load discover movies")
        }

        setMovies(fallbackData.results || [])
      } catch (error) {
        console.error("Error fetching movies:", error)
        setMovies([])
        setError(error instanceof Error ? error.message : "Failed to load discover movies")
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [activeTab, country, providerId])

  const selectedCountryLabel = getCountryByCode(country).label

  return (
    <Layout>
      <section className="py-16">
        <div className="container px-4">
          <h1 className="text-3xl font-bold mb-8">Discover Movies</h1>
          <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-muted-foreground">
              <Globe className="h-3.5 w-3.5 text-netflix-red" />
              <span>
                Showing titles for <span className="text-white">{serviceName}</span> in{" "}
                <span className="text-white">{selectedCountryLabel}</span>
              </span>
            </div>
            {settingsUpdated && (
              <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/20">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Settings updated
              </Badge>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <div className="overflow-x-auto pb-2">
              <TabsList className="bg-secondary inline-flex whitespace-nowrap">
                <TabsTrigger value="trending">Trending</TabsTrigger>
                <TabsTrigger value="popular">Popular</TabsTrigger>
                <TabsTrigger value="top_rated">Top Rated</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              </TabsList>
            </div>

            <div className="mb-6">
              <h2 className="font-medium mb-3">Browse by Genre</h2>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Button
                    key={genre.id}
                    variant="outline"
                    size="sm"
                    className={activeTab === `genre_${genre.id}` ? "bg-primary text-primary-foreground" : ""}
                    onClick={() => setActiveTab(`genre_${genre.id}`)}
                  >
                    {genre.name}
                  </Button>
                ))}
              </div>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="aspect-[2/3] bg-muted rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-lg border p-6 bg-card">
                  <p className="text-netflix-red font-medium mb-2">Could not load this category</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              ) : movies.length === 0 ? (
                <div className="rounded-lg border p-6 bg-card">
                  <p className="font-medium mb-2">No titles found for this category</p>
                  <p className="text-sm text-muted-foreground">
                    We couldn&apos;t find matching titles for {serviceName} in {selectedCountryLabel}. Try another
                    category, service, or country.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {movies.map((movie) => (
                    <Link key={movie.id} href={`/movie/${movie.id}`}>
                      <Card className="border-0 overflow-hidden card-hover">
                        <CardContent className="p-0">
                          <div className="aspect-[2/3] overflow-hidden">
                            {movie.poster_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                                alt={movie.title}
                                className="w-full h-full object-cover image-hover"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <span className="text-2xl font-bold text-muted-foreground">
                                  {movie.title.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="font-medium truncate">{movie.title}</h3>
                            <div className="flex items-center justify-between mt-1 text-sm">
                              <div className="flex items-center">
                                <span className="text-yellow-500">★</span>
                                <span className="ml-1">{movie.vote_average.toFixed(1)}</span>
                              </div>
                              <span className="text-muted-foreground">
                                {movie.release_date?.substring(0, 4) || "N/A"}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  )
}
