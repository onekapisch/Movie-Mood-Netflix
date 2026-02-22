"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react"

const genres = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "Western",
]

const languages = ["English", "Spanish", "French", "German", "Italian", "Japanese", "Korean", "Chinese", "Hindi"]

const ratings = ["G", "PG", "PG-13", "R", "NC-17", "TV-Y", "TV-G", "TV-14", "TV-MA"]

type AdvancedFilterState = {
  genres: string[]
  languages: string[]
  ratings: string[]
  releaseYears: [number, number]
  runtime: [number, number]
}

export default function AdvancedFilters({ onFilterChange }: { onFilterChange: (filters: any) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<AdvancedFilterState>({
    genres: [],
    languages: ["English"],
    ratings: [],
    releaseYears: [1990, 2023],
    runtime: [0, 240],
  })

  const handleFilterChange = (category: string, value: any) => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev, [category]: value }
      onFilterChange(newFilters)
      return newFilters
    })
  }

  const toggleFilter = (category: string, value: string) => {
    setActiveFilters((prev) => {
      const currentValues = [...prev[category as keyof typeof prev]] as string[]
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]

      const newFilters = { ...prev, [category]: newValues }
      onFilterChange(newFilters)
      return newFilters
    })
  }

  const clearFilters = () => {
    const defaultFilters: AdvancedFilterState = {
      genres: [],
      languages: ["English"],
      ratings: [],
      releaseYears: [1990, 2023],
      runtime: [0, 240],
    }
    setActiveFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  const activeFilterCount =
    activeFilters.genres.length +
    (activeFilters.languages.length > 1 ? activeFilters.languages.length : 0) +
    activeFilters.ratings.length +
    (activeFilters.releaseYears[0] !== 1990 || activeFilters.releaseYears[1] !== 2023 ? 1 : 0) +
    (activeFilters.runtime[0] !== 0 || activeFilters.runtime[1] !== 240 ? 1 : 0)

  return (
    <div className="w-full mb-6 border rounded-lg">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="font-medium">Filters</h3>
          {activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          )}
          <CollapsibleTrigger asChild onClick={() => setIsOpen(!isOpen)}>
            <Button variant="ghost" size="sm">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <div className="p-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Genres */}
              <div>
                <h4 className="font-medium mb-2">Genres</h4>
                <div className="grid grid-cols-2 gap-2">
                  {genres.map((genre) => (
                    <div key={genre} className="flex items-center space-x-2">
                      <Checkbox
                        id={`genre-${genre}`}
                        checked={activeFilters.genres.includes(genre)}
                        onCheckedChange={() => toggleFilter("genres", genre)}
                      />
                      <label
                        htmlFor={`genre-${genre}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {genre}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <h4 className="font-medium mb-2">Languages</h4>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((language) => (
                    <div key={language} className="flex items-center space-x-2">
                      <Checkbox
                        id={`language-${language}`}
                        checked={activeFilters.languages.includes(language)}
                        onCheckedChange={() => toggleFilter("languages", language)}
                      />
                      <label
                        htmlFor={`language-${language}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {language}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ratings */}
              <div>
                <h4 className="font-medium mb-2">Ratings</h4>
                <div className="grid grid-cols-3 gap-2">
                  {ratings.map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <Checkbox
                        id={`rating-${rating}`}
                        checked={activeFilters.ratings.includes(rating)}
                        onCheckedChange={() => toggleFilter("ratings", rating)}
                      />
                      <label
                        htmlFor={`rating-${rating}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {rating}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Release Years */}
            <div className="mt-6">
              <h4 className="font-medium mb-2">
                Release Years: {activeFilters.releaseYears[0]} - {activeFilters.releaseYears[1]}
              </h4>
              <Slider
                min={1920}
                max={2023}
                step={1}
                value={activeFilters.releaseYears}
                onValueChange={(value) => handleFilterChange("releaseYears", value)}
                className="my-4"
              />
            </div>

            {/* Runtime */}
            <div className="mt-4">
              <h4 className="font-medium mb-2">
                Runtime: {activeFilters.runtime[0]} - {activeFilters.runtime[1]} minutes
              </h4>
              <Slider
                min={0}
                max={240}
                step={5}
                value={activeFilters.runtime}
                onValueChange={(value) => handleFilterChange("runtime", value)}
                className="my-4"
              />
            </div>

            {/* Active Filters */}
            {activeFilterCount > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Active Filters</h4>
                <div className="flex flex-wrap gap-2">
                  {activeFilters.genres.map((genre) => (
                    <Badge key={genre} variant="outline" className="flex items-center gap-1">
                      {genre}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter("genres", genre)} />
                    </Badge>
                  ))}
                  {activeFilters.languages.length > 1 &&
                    activeFilters.languages.map((language) => (
                      <Badge key={language} variant="outline" className="flex items-center gap-1">
                        {language}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter("languages", language)} />
                      </Badge>
                    ))}
                  {activeFilters.ratings.map((rating) => (
                    <Badge key={rating} variant="outline" className="flex items-center gap-1">
                      {rating}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter("ratings", rating)} />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
