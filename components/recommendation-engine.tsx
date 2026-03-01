"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  HeartIcon,
  SmileIcon,
  FrownIcon,
  PartyPopperIcon,
  CoffeeIcon,
  MoonIcon,
  ZapIcon,
  ClockIcon,
  SparklesIcon,
  GlobeIcon,
  SlidersHorizontalIcon,
  StarIcon,
  Users,
  User,
  Heart,
  Baby,
  UserPlus,
  ArrowRight,
} from "lucide-react"
import RecommendationResults from "./recommendation-results"
import { DEFAULT_COUNTRY, DEFAULT_SERVICE_KEY, getServiceByKey } from "@/lib/streaming-options"

interface MoodOption {
  id: string
  label: string
  icon: React.ElementType
  description: string
  emoji: string
  color: string
  glowColor: string
}

const moodOptions: MoodOption[] = [
  {
    id: "happy",
    label: "Happy",
    icon: SmileIcon,
    description: "Uplifting, feel-good vibes",
    emoji: "😊",
    color: "rgba(250,204,21,0.1)",
    glowColor: "rgba(250,204,21,0.25)",
  },
  {
    id: "sad",
    label: "Sad",
    icon: FrownIcon,
    description: "Emotional, moving stories",
    emoji: "😢",
    color: "rgba(96,165,250,0.1)",
    glowColor: "rgba(96,165,250,0.25)",
  },
  {
    id: "excited",
    label: "Excited",
    icon: PartyPopperIcon,
    description: "Action-packed, thrilling",
    emoji: "🎉",
    color: "rgba(251,146,60,0.1)",
    glowColor: "rgba(251,146,60,0.25)",
  },
  {
    id: "relaxed",
    label: "Relaxed",
    icon: CoffeeIcon,
    description: "Calm, easy-going viewing",
    emoji: "☕",
    color: "rgba(52,211,153,0.1)",
    glowColor: "rgba(52,211,153,0.25)",
  },
  {
    id: "thoughtful",
    label: "Thoughtful",
    icon: MoonIcon,
    description: "Thought-provoking, deep",
    emoji: "🌙",
    color: "rgba(167,139,250,0.1)",
    glowColor: "rgba(167,139,250,0.25)",
  },
  {
    id: "energetic",
    label: "Energetic",
    icon: ZapIcon,
    description: "Fast-paced, intense",
    emoji: "⚡",
    color: "rgba(229,9,20,0.1)",
    glowColor: "rgba(229,9,20,0.25)",
  },
]

interface WatchWithOption {
  id: string
  label: string
  icon: React.ElementType
  description: string
  genreBoost: number[]
}

const watchWithOptions: WatchWithOption[] = [
  {
    id: "solo",
    label: "Solo",
    icon: User,
    description: "Just me",
    genreBoost: [],
  },
  {
    id: "partner",
    label: "Partner",
    icon: Heart,
    description: "Date night",
    genreBoost: [10749, 18, 35],
  },
  {
    id: "friends",
    label: "Friends",
    icon: Users,
    description: "Group watch",
    genreBoost: [35, 28, 27, 12],
  },
  {
    id: "family",
    label: "Family",
    icon: UserPlus,
    description: "Everyone",
    genreBoost: [10751, 16, 12, 35],
  },
  {
    id: "kids",
    label: "Kids night",
    icon: Baby,
    description: "Kid-friendly",
    genreBoost: [10751, 16, 12],
  },
]

const genreOptions = [
  { id: "28", label: "Action" },
  { id: "12", label: "Adventure" },
  { id: "16", label: "Animation" },
  { id: "35", label: "Comedy" },
  { id: "80", label: "Crime" },
  { id: "99", label: "Documentary" },
  { id: "18", label: "Drama" },
  { id: "10751", label: "Family" },
  { id: "14", label: "Fantasy" },
  { id: "36", label: "History" },
  { id: "27", label: "Horror" },
  { id: "10402", label: "Music" },
  { id: "9648", label: "Mystery" },
  { id: "10749", label: "Romance" },
  { id: "878", label: "Sci-Fi" },
  { id: "53", label: "Thriller" },
]

const sortOptions = [
  { id: "best_match", label: "Best Match (Mood Based)" },
  { id: "rating_desc", label: "Highest Rating" },
  { id: "popularity_desc", label: "Most Popular" },
  { id: "newest_desc", label: "Newest Releases" },
  { id: "oldest_asc", label: "Oldest Releases" },
]

const releaseWindowOptions = [
  { id: "any", label: "Any Time" },
  { id: "last_3_years", label: "Last 3 Years" },
  { id: "last_10_years", label: "Last 10 Years" },
  { id: "classics", label: "Classics (pre-2001)" },
]

const languageOptions = [
  { id: "any", label: "Any Language" },
  { id: "en", label: "English" },
  { id: "es", label: "Spanish" },
  { id: "fr", label: "French" },
  { id: "de", label: "German" },
  { id: "ja", label: "Japanese" },
  { id: "ko", label: "Korean" },
  { id: "hi", label: "Hindi" },
]

interface RecommendationEngineProps {
  initialMood?: string
  initialGenres?: string[]
  initialRuntime?: number
  initialRating?: number
  initialSort?: string
  initialReleaseWindow?: string
  initialLanguage?: string
  initialWatchWith?: string
  autoSearch?: boolean
}

export default function RecommendationEngine({
  initialMood,
  initialGenres = [],
  initialRuntime = 120,
  initialRating = 6.5,
  initialSort = "best_match",
  initialReleaseWindow = "any",
  initialLanguage = "any",
  initialWatchWith = "solo",
  autoSearch = false,
}: RecommendationEngineProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(initialMood || null)
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenres)
  const [contentLength, setContentLength] = useState<number>(initialRuntime)
  const [activeTab, setActiveTab] = useState(initialMood ? "genres" : "mood")
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<string>(DEFAULT_COUNTRY)
  const [selectedServiceKey, setSelectedServiceKey] = useState<string>(DEFAULT_SERVICE_KEY)
  const [selectedServiceName, setSelectedServiceName] = useState<string>(getServiceByKey(DEFAULT_SERVICE_KEY).label)
  const [selectedProviderId, setSelectedProviderId] = useState<number>(getServiceByKey(DEFAULT_SERVICE_KEY).providerId)
  const [sortBy, setSortBy] = useState<string>(initialSort)
  const [minRating, setMinRating] = useState<number>(initialRating)
  const [minVotes, setMinVotes] = useState<number>(300)
  const [releaseWindow, setReleaseWindow] = useState<string>(initialReleaseWindow)
  const [language, setLanguage] = useState<string>(initialLanguage)
  const [watchWith, setWatchWith] = useState<string>(initialWatchWith)
  const { toast } = useToast()

  useEffect(() => {
    const handleStreamingFiltersChange = (event: Event) => {
      const customEvent = event as CustomEvent<{
        serviceKey: string
        serviceName: string
        providerId: number
        country: string
      }>
      if (!customEvent.detail) return
      setSelectedServiceKey(customEvent.detail.serviceKey)
      setSelectedServiceName(customEvent.detail.serviceName)
      setSelectedProviderId(customEvent.detail.providerId)
      setSelectedCountry(customEvent.detail.country)
    }

    window.addEventListener("streamingfilterschange", handleStreamingFiltersChange)

    const savedServiceKey = localStorage.getItem("selectedStreamingService") || DEFAULT_SERVICE_KEY
    const savedService = getServiceByKey(savedServiceKey)
    const savedCountry =
      localStorage.getItem(`selectedCountry:${savedService.key}`) || localStorage.getItem("selectedCountry")

    setSelectedServiceKey(savedService.key)
    setSelectedServiceName(savedService.label)
    setSelectedProviderId(savedService.providerId)
    if (savedCountry) setSelectedCountry(savedCountry)

    return () => window.removeEventListener("streamingfilterschange", handleStreamingFiltersChange)
  }, [])

  // Auto-trigger search from URL params
  useEffect(() => {
    if (autoSearch && initialMood) {
      setTimeout(() => {
        setIsSearching(true)
        setTimeout(() => {
          setIsSearching(false)
          setShowResults(true)
        }, 800)
      }, 400)
    }
  }, [])

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId)
    setActiveTab("genres")
  }

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId],
    )
  }

  // Merge Watch With genre boosts into the active genre list
  const getEffectiveGenres = (): string[] => {
    const ww = watchWithOptions.find((w) => w.id === watchWith)
    if (!ww || ww.genreBoost.length === 0) return selectedGenres
    const boostedIds = ww.genreBoost.map(String)
    const merged = [...new Set([...selectedGenres, ...boostedIds])]
    return merged
  }

  const buildVibeUrl = (): string => {
    if (typeof window === "undefined") return ""
    const base = `${window.location.origin}/recommendations`
    const params = new URLSearchParams({
      mood: selectedMood || "",
      genres: selectedGenres.join(","),
      runtime: String(contentLength),
      rating: String(minRating),
      sort: sortBy,
      window: releaseWindow,
      lang: language,
      with: watchWith,
      service: selectedServiceKey,
      country: selectedCountry,
    })
    return `${base}?${params.toString()}&auto=1`
  }

  const handleSearch = () => {
    if (!selectedMood) {
      toast({
        title: "Pick a mood first",
        description: "Select how you're feeling to get recommendations",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    setTimeout(() => {
      setIsSearching(false)
      setShowResults(true)
    }, 1000)
  }

  const resetSearch = () => {
    setShowResults(false)
    setSelectedMood(null)
    setSelectedGenres([])
    setContentLength(120)
    setSortBy("best_match")
    setMinRating(6.5)
    setMinVotes(300)
    setReleaseWindow("any")
    setLanguage("any")
    setWatchWith("solo")
    setActiveTab("mood")
  }

  // ── Results view ──
  if (showResults) {
    const effectiveGenres = getEffectiveGenres()
    return (
      <div className="space-y-6">
        {/* Active filters bar */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge
              className="rounded-full px-3 gap-1 text-white font-medium border-0"
              style={{ background: "rgba(229,9,20,0.2)" }}
            >
              <HeartIcon className="h-3 w-3" />
              {moodOptions.find((m) => m.id === selectedMood)?.emoji}{" "}
              {moodOptions.find((m) => m.id === selectedMood)?.label}
            </Badge>

            {selectedGenres.map((genreId) => (
              <Badge
                key={genreId}
                variant="outline"
                className="rounded-full px-3 text-white/60 border-white/10"
              >
                {genreOptions.find((g) => g.id === genreId)?.label}
              </Badge>
            ))}

            {watchWith !== "solo" && (
              <Badge
                variant="outline"
                className="rounded-full px-3 text-white/60 border-white/10"
              >
                {watchWithOptions.find((w) => w.id === watchWith)?.label}
              </Badge>
            )}

            <Badge variant="outline" className="rounded-full px-3 text-white/60 border-white/10">
              <ClockIcon className="h-3 w-3 mr-1" />
              {contentLength}m
            </Badge>

            <Badge
              className="rounded-full px-3 text-white font-medium border-0"
              style={{ background: "rgba(229,9,20,0.15)" }}
            >
              <GlobeIcon className="h-3 w-3 mr-1" />
              {selectedCountry.toUpperCase()} · {selectedServiceName}
            </Badge>

            <Badge variant="outline" className="rounded-full px-3 text-white/60 border-white/10">
              <StarIcon className="h-3 w-3 mr-1" />
              {minRating.toFixed(1)}+
            </Badge>
          </div>

          <Button onClick={resetSearch} variant="outline" size="sm" className="glass-button rounded-xl text-white/60">
            Change preferences
          </Button>
        </div>

        <RecommendationResults
          mood={selectedMood || ""}
          genres={effectiveGenres}
          maxRuntime={contentLength}
          country={selectedCountry}
          serviceName={selectedServiceName}
          providerId={selectedProviderId}
          serviceKey={selectedServiceKey}
          sortBy={sortBy}
          minRating={minRating}
          minVotes={minVotes}
          releaseWindow={releaseWindow}
          language={language}
          watchWith={watchWith}
          vibeUrl={buildVibeUrl()}
        />
      </div>
    )
  }

  // ── Wizard view ──
  const glassPanelStyle = {
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.07)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
  }

  return (
    <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden" style={glassPanelStyle}>
      <div className="p-6 md:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tab bar */}
          <TabsList
            className="grid grid-cols-3 mb-8 rounded-xl p-1 gap-1"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {[
              { value: "mood", label: "1. Mood" },
              { value: "genres", label: "2. Genres" },
              { value: "length", label: "3. Settings" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-lg text-sm font-medium text-white/40 data-[state=active]:text-white transition-all"
                style={{
                  ...(activeTab === tab.value
                    ? {
                        background: "rgba(229,9,20,0.15)",
                        color: "white",
                        boxShadow: "0 0 20px rgba(229,9,20,0.15)",
                      }
                    : {}),
                }}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Step 1: Mood */}
          <TabsContent value="mood" className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">How are you feeling?</h2>
              <p className="text-white/40 text-sm">Select the mood that matches your vibe right now</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {moodOptions.map((mood) => {
                const isSelected = selectedMood === mood.id
                return (
                  <div
                    key={mood.id}
                    className={`mood-card p-4 text-center ${isSelected ? "selected" : ""}`}
                    onClick={() => handleMoodSelect(mood.id)}
                    style={
                      isSelected
                        ? {
                            background: mood.color,
                            borderColor: mood.glowColor,
                            boxShadow: `0 0 30px ${mood.glowColor.replace("0.25", "0.12")}`,
                          }
                        : {}
                    }
                  >
                    <div className="text-3xl mb-2">{mood.emoji}</div>
                    <h3 className="font-semibold text-white text-sm">{mood.label}</h3>
                    <p className="text-xs text-white/40 mt-1">{mood.description}</p>
                  </div>
                )
              })}
            </div>

            {/* Watch With */}
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-white/30 mb-3">
                Who are you watching with?
              </p>
              <div className="flex flex-wrap gap-2">
                {watchWithOptions.map((option) => {
                  const isSelected = watchWith === option.id
                  return (
                    <button
                      key={option.id}
                      onClick={() => setWatchWith(option.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                      style={{
                        background: isSelected ? "rgba(229,9,20,0.15)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${isSelected ? "rgba(229,9,20,0.4)" : "rgba(255,255,255,0.08)"}`,
                        color: isSelected ? "white" : "rgba(255,255,255,0.5)",
                        boxShadow: isSelected ? "0 0 16px rgba(229,9,20,0.12)" : "none",
                      }}
                    >
                      <option.icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </button>
                  )
                })}
              </div>
              {watchWith !== "solo" && (
                <p className="text-xs text-white/30 mt-2">
                  ✓ Genre suggestions will be adjusted for{" "}
                  <span className="text-white/50">{watchWithOptions.find((w) => w.id === watchWith)?.description}</span>
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setActiveTab("genres")}
                disabled={!selectedMood}
                className="glow-button rounded-xl px-6 gap-2"
              >
                Next: Genres
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Step 2: Genres */}
          <TabsContent value="genres" className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Pick your genres</h2>
              <p className="text-white/40 text-sm">Select any you&apos;re in the mood for — or skip for broad results</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {genreOptions.map((genre) => (
                <div
                  key={genre.id}
                  className={`genre-pill px-3 py-2.5 text-center text-sm font-medium ${selectedGenres.includes(genre.id) ? "selected" : ""}`}
                  onClick={() => toggleGenre(genre.id)}
                >
                  {genre.label}
                </div>
              ))}
            </div>

            {selectedGenres.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/30">Selected:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedGenres.map((gid) => (
                    <span
                      key={gid}
                      className="text-xs px-2 py-0.5 rounded-full text-netflix-red"
                      style={{ background: "rgba(229,9,20,0.1)", border: "1px solid rgba(229,9,20,0.2)" }}
                    >
                      {genreOptions.find((g) => g.id === gid)?.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                className="glass-button rounded-xl text-white/60"
                onClick={() => setActiveTab("mood")}
              >
                Back
              </Button>
              <Button
                className="glow-button rounded-xl px-6 gap-2"
                onClick={() => setActiveTab("length")}
              >
                Next: Settings
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Step 3: Duration + advanced */}
          <TabsContent value="length" className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Fine-tune your results</h2>
              <p className="text-white/40 text-sm">Set runtime limits and advanced filters</p>
            </div>

            {/* Runtime slider */}
            <div
              className="rounded-xl p-4 space-y-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-netflix-red" />
                  Maximum runtime
                </span>
                <span className="text-sm font-bold text-white">
                  {contentLength >= 240 ? "No limit" : `${contentLength} min`}
                </span>
              </div>
              <Slider
                min={30}
                max={240}
                step={15}
                value={[contentLength]}
                onValueChange={(v) => setContentLength(v[0])}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-white/25">
                <span>30m</span>
                <span>1h</span>
                <span>2h</span>
                <span>3h+</span>
              </div>
            </div>

            {/* Advanced filters */}
            <div
              className="rounded-xl p-4 space-y-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <SlidersHorizontalIcon className="h-4 w-4 text-netflix-red" />
                <h3 className="font-semibold text-white text-sm">Advanced Filters</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-white/50">Sort results by</p>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="glass-input rounded-lg text-sm h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-white/50">Minimum votes</p>
                  <Select value={String(minVotes)} onValueChange={(v) => setMinVotes(Number(v))}>
                    <SelectTrigger className="glass-input rounded-lg text-sm h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50+ votes</SelectItem>
                      <SelectItem value="100">100+ votes</SelectItem>
                      <SelectItem value="300">300+ votes</SelectItem>
                      <SelectItem value="1000">1,000+ votes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-white/50">Release window</p>
                  <Select value={releaseWindow} onValueChange={setReleaseWindow}>
                    <SelectTrigger className="glass-input rounded-lg text-sm h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {releaseWindowOptions.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-white/50">Language</p>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="glass-input rounded-lg text-sm h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-white/50 flex items-center gap-1.5">
                    <StarIcon className="h-3.5 w-3.5 text-yellow-400" />
                    Min. rating
                  </span>
                  <span className="text-sm font-bold text-white">{minRating.toFixed(1)}</span>
                </div>
                <Slider
                  min={0}
                  max={9}
                  step={0.5}
                  value={[minRating]}
                  onValueChange={(v) => setMinRating(v[0])}
                />
              </div>
            </div>

            {/* Your selection summary */}
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(229,9,20,0.05)", border: "1px solid rgba(229,9,20,0.1)" }}
            >
              <p className="text-xs font-semibold tracking-wider uppercase text-white/30 mb-3">Your selection</p>
              <div className="flex flex-wrap gap-2">
                {selectedMood && (
                  <Badge className="rounded-full border-0 text-white" style={{ background: "rgba(229,9,20,0.2)" }}>
                    {moodOptions.find((m) => m.id === selectedMood)?.emoji}{" "}
                    {moodOptions.find((m) => m.id === selectedMood)?.label}
                  </Badge>
                )}
                {selectedGenres.map((gid) => (
                  <Badge key={gid} variant="outline" className="rounded-full text-white/60 border-white/10">
                    {genreOptions.find((g) => g.id === gid)?.label}
                  </Badge>
                ))}
                {watchWith !== "solo" && (
                  <Badge variant="outline" className="rounded-full text-white/60 border-white/10">
                    {watchWithOptions.find((w) => w.id === watchWith)?.label}
                  </Badge>
                )}
                <Badge variant="outline" className="rounded-full text-white/60 border-white/10">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {contentLength}m
                </Badge>
                <Badge className="rounded-full border-0 text-white" style={{ background: "rgba(229,9,20,0.15)" }}>
                  <GlobeIcon className="h-3 w-3 mr-1" />
                  {selectedCountry.toUpperCase()} · {selectedServiceName}
                </Badge>
                <Badge variant="outline" className="rounded-full text-white/60 border-white/10">
                  <StarIcon className="h-3 w-3 mr-1" />
                  {minRating.toFixed(1)}+
                </Badge>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                className="glass-button rounded-xl text-white/60"
                onClick={() => setActiveTab("genres")}
              >
                Back
              </Button>
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="glow-button rounded-xl px-8 gap-2"
              >
                {isSearching ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Finding matches…
                  </>
                ) : (
                  <>
                    Get Recommendations
                    <SparklesIcon className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
