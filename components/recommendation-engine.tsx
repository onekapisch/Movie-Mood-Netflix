"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  ThumbsUpIcon,
  GlobeIcon,
  SlidersHorizontalIcon,
  StarIcon,
} from "lucide-react"
import RecommendationResults from "./recommendation-results"
import { DEFAULT_COUNTRY, DEFAULT_SERVICE_KEY, getServiceByKey } from "@/lib/streaming-options"

interface MoodOption {
  id: string
  label: string
  icon: React.ElementType
  description: string
}

const moodOptions: MoodOption[] = [
  {
    id: "happy",
    label: "Happy",
    icon: SmileIcon,
    description: "Uplifting, feel-good content",
  },
  {
    id: "sad",
    label: "Sad",
    icon: FrownIcon,
    description: "Emotional, moving stories",
  },
  {
    id: "excited",
    label: "Excited",
    icon: PartyPopperIcon,
    description: "Action-packed, thrilling content",
  },
  {
    id: "relaxed",
    label: "Relaxed",
    icon: CoffeeIcon,
    description: "Calm, easy-going viewing",
  },
  {
    id: "thoughtful",
    label: "Thoughtful",
    icon: MoonIcon,
    description: "Thought-provoking, deep content",
  },
  {
    id: "energetic",
    label: "Energetic",
    icon: ZapIcon,
    description: "Fast-paced, engaging content",
  },
]

interface GenreOption {
  id: string
  label: string
}

const genreOptions: GenreOption[] = [
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
  { id: "878", label: "Science Fiction" },
  { id: "53", label: "Thriller" },
]

const sortOptions = [
  { id: "best_match", label: "Best Match (Mood Based)" },
  { id: "rating_desc", label: "Highest IMDb-Style Rating" },
  { id: "popularity_desc", label: "Most Popular" },
  { id: "newest_desc", label: "Newest Releases" },
  { id: "oldest_asc", label: "Oldest Releases" },
]

const releaseWindowOptions = [
  { id: "any", label: "Any Time" },
  { id: "last_3_years", label: "Last 3 Years" },
  { id: "last_10_years", label: "Last 10 Years" },
  { id: "classics", label: "Classics (2000 or older)" },
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

export default function RecommendationEngine() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [contentLength, setContentLength] = useState<number>(120)
  const [activeTab, setActiveTab] = useState("mood")
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<string>(DEFAULT_COUNTRY)
  const [selectedServiceKey, setSelectedServiceKey] = useState<string>(DEFAULT_SERVICE_KEY)
  const [selectedServiceName, setSelectedServiceName] = useState<string>(getServiceByKey(DEFAULT_SERVICE_KEY).label)
  const [selectedProviderId, setSelectedProviderId] = useState<number>(getServiceByKey(DEFAULT_SERVICE_KEY).providerId)
  const [sortBy, setSortBy] = useState<string>("best_match")
  const [minRating, setMinRating] = useState<number>(6.5)
  const [minVotes, setMinVotes] = useState<number>(300)
  const [releaseWindow, setReleaseWindow] = useState<string>("any")
  const [language, setLanguage] = useState<string>("any")
  const { toast } = useToast()

  useEffect(() => {
    const handleStreamingFiltersChange = (event: Event) => {
      const customEvent = event as CustomEvent<{
        serviceKey: string
        serviceName: string
        providerId: number
        country: string
      }>

      if (!customEvent.detail) {
        return
      }

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

    if (savedCountry) {
      setSelectedCountry(savedCountry)
    }

    return () => {
      window.removeEventListener("streamingfilterschange", handleStreamingFiltersChange)
    }
  }, [])

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId)
    setActiveTab("genres")
  }

  const toggleGenre = (genreId: string) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(selectedGenres.filter((id) => id !== genreId))
    } else {
      setSelectedGenres([...selectedGenres, genreId])
    }
  }

  const handleSearch = () => {
    if (!selectedMood) {
      toast({
        title: "Please select a mood",
        description: "Select your current mood to get recommendations",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)

    // Simulate API call
    setTimeout(() => {
      setIsSearching(false)
      setShowResults(true)
    }, 1500)
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
    setActiveTab("mood")
  }

  if (showResults) {
    return (
      <div className="space-y-6">
        <div className="bg-card rounded-lg p-4 border">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className="bg-primary/20 text-primary border-0">
              <HeartIcon className="h-3 w-3 mr-1" />
              {moodOptions.find((m) => m.id === selectedMood)?.label}
            </Badge>

            {selectedGenres.map((genreId) => (
              <Badge key={genreId} variant="outline">
                {genreOptions.find((g) => g.id === genreId)?.label}
              </Badge>
            ))}

            <Badge variant="outline">
              <ClockIcon className="h-3 w-3 mr-1" />
              {contentLength} minutes
            </Badge>

            <Badge className="bg-netflix-red text-white border-0">
              <GlobeIcon className="h-3 w-3 mr-1" />
              {selectedCountry.toUpperCase()} {selectedServiceName}
            </Badge>

            <Badge variant="outline">
              <StarIcon className="h-3 w-3 mr-1" />
              {minRating.toFixed(1)}+
            </Badge>

            <Badge variant="outline">{sortOptions.find((option) => option.id === sortBy)?.label}</Badge>
          </div>

          <Button onClick={resetSearch} variant="outline" size="sm">
            Change Preferences
          </Button>
        </div>

        <RecommendationResults
          mood={selectedMood || ""}
          genres={selectedGenres}
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
        />
      </div>
    )
  }

  return (
    <Card className="max-w-4xl mx-auto border">
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="mood">1. Mood</TabsTrigger>
            <TabsTrigger value="genres">2. Genres</TabsTrigger>
            <TabsTrigger value="length">3. Length</TabsTrigger>
          </TabsList>

          <TabsContent value="mood" className="space-y-6">
            <p className="text-center text-muted-foreground mb-6">
              How are you feeling today? Select the mood that best matches your current state of mind.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {moodOptions.map((mood) => (
                <div
                  key={mood.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedMood === mood.id ? `border-netflix-red bg-netflix-red/5` : "hover:border-netflix-red/50"
                  }`}
                  onClick={() => handleMoodSelect(mood.id)}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <mood.icon className={`h-8 w-8 ${selectedMood === mood.id ? "text-netflix-red" : ""}`} />
                    <h3 className="font-medium">{mood.label}</h3>
                    <p className="text-xs text-muted-foreground">{mood.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <Button
                onClick={() => setActiveTab("genres")}
                disabled={!selectedMood}
                className="gap-2 bg-netflix-red hover:bg-netflix-red/90"
              >
                Next Step <SparklesIcon className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="genres" className="space-y-6">
            <p className="text-center text-muted-foreground mb-6">
              Select one or more genres you're in the mood for today.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {genreOptions.map((genre) => (
                <div
                  key={genre.id}
                  className={`border rounded-lg px-3 py-2 cursor-pointer text-center transition-all ${
                    selectedGenres.includes(genre.id)
                      ? `border-netflix-red bg-netflix-red/5`
                      : "hover:border-netflix-red/50"
                  }`}
                  onClick={() => toggleGenre(genre.id)}
                >
                  {genre.label}
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setActiveTab("mood")}>
                Back
              </Button>
              <Button onClick={() => setActiveTab("length")} className="gap-2 bg-netflix-red hover:bg-netflix-red/90">
                Next Step <ThumbsUpIcon className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="length" className="space-y-6">
            <p className="text-center text-muted-foreground mb-6">
              How much time do you have available and how should we rank the results?
            </p>

            <div className="space-y-4">
              <h3 className="font-medium text-center">Content Length: {contentLength} minutes</h3>
              <Slider
                min={30}
                max={240}
                step={15}
                value={[contentLength]}
                onValueChange={(value) => setContentLength(value[0])}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>30 min</span>
                <span>1 hour</span>
                <span>2 hours</span>
                <span>4 hours</span>
              </div>
            </div>

            <div className="bg-secondary rounded-lg p-4 mt-8">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontalIcon className="h-4 w-4 text-netflix-red" />
                <h3 className="font-medium">Advanced Filters</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Sort Results</p>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Minimum Vote Count</p>
                  <Select value={String(minVotes)} onValueChange={(value) => setMinVotes(Number(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vote count threshold" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50+ votes</SelectItem>
                      <SelectItem value="100">100+ votes</SelectItem>
                      <SelectItem value="300">300+ votes</SelectItem>
                      <SelectItem value="1000">1000+ votes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Release Window</p>
                  <Select value={releaseWindow} onValueChange={setReleaseWindow}>
                    <SelectTrigger>
                      <SelectValue placeholder="Release window" />
                    </SelectTrigger>
                    <SelectContent>
                      {releaseWindowOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Original Language</p>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                  <p className="text-sm font-medium">Minimum TMDB Rating: {minRating.toFixed(1)}</p>
                <Slider
                  min={0}
                  max={10}
                  step={0.5}
                  value={[minRating]}
                  onValueChange={(value) => setMinRating(value[0])}
                />
              </div>

              <h3 className="font-medium mb-2">Your Selection</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedMood && (
                  <Badge className="bg-netflix-red/20 text-netflix-red border-0">
                    <HeartIcon className="h-3 w-3 mr-1" />
                    {moodOptions.find((m) => m.id === selectedMood)?.label}
                  </Badge>
                )}

                {selectedGenres.map((genreId) => (
                  <Badge key={genreId} variant="outline">
                    {genreOptions.find((g) => g.id === genreId)?.label}
                  </Badge>
                ))}

                <Badge variant="outline">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {contentLength} minutes
                </Badge>

                <Badge className="bg-netflix-red text-white border-0">
                  <GlobeIcon className="h-3 w-3 mr-1" />
                  {selectedCountry.toUpperCase()} {selectedServiceName}
                </Badge>

                <Badge variant="outline">
                  <StarIcon className="h-3 w-3 mr-1" />
                  {minRating.toFixed(1)}+
                </Badge>

                <Badge variant="outline">{sortOptions.find((option) => option.id === sortBy)?.label}</Badge>

                <Badge variant="outline">{releaseWindowOptions.find((option) => option.id === releaseWindow)?.label}</Badge>

                {language !== "any" && (
                  <Badge variant="outline">{languageOptions.find((option) => option.id === language)?.label}</Badge>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setActiveTab("genres")}>
                Back
              </Button>
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="gap-2 bg-netflix-red hover:bg-netflix-red/90"
              >
                {isSearching ? "Searching..." : "Get Recommendations"}
                <SparklesIcon className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
