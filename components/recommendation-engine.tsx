"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
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
            <p className="text-center text-muted-foreground mb-6">How much time do you have available for watching?</p>

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
