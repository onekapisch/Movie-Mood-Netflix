"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Play, Plus, ThumbsUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

interface ContentCardProps {
  id: number
  title: string
  posterPath: string | null
  mediaType: "movie" | "tv"
}

export default function ContentCard({ id, title, posterPath, mediaType }: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()

  const handleAddToList = (e: React.MouseEvent) => {
    e.stopPropagation()
    toast({
      title: "Added to My List",
      description: `${title} has been added to your list`,
    })
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    toast({
      title: "Liked",
      description: `You liked ${title}`,
    })
  }

  const handleMoreInfo = (e: React.MouseEvent) => {
    e.stopPropagation()
    // In a real app, this would open a modal with more details
    router.push(`/${mediaType}/${id}`)
  }

  return (
    <div
      className="relative flex-shrink-0 w-[180px] netflix-hover-scale"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`netflix-card transition-all duration-300 ${isHovered ? "scale-110 z-10" : ""}`}>
        {/* Poster Image */}
        <div className="aspect-[2/3] relative">
          {posterPath ? (
            <img
              src={`https://image.tmdb.org/t/p/w342${posterPath}`}
              alt={title}
              className="w-full h-full object-cover rounded-t-md"
            />
          ) : (
            <div className="w-full h-full bg-netflix-dark flex items-center justify-center rounded-t-md">
              <span className="text-netflix-gray">{title.charAt(0)}</span>
            </div>
          )}

          {/* Hover Controls */}
          {isHovered && (
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1 flex items-center justify-center">
                <Button className="netflix-button rounded-full w-12 h-12 p-0" onClick={handleMoreInfo}>
                  <Play className="h-6 w-6" />
                </Button>
              </div>
              <div className="p-2 bg-netflix-dark">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-white/20 hover:bg-white/30"
                      onClick={handleAddToList}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-white/20 hover:bg-white/30"
                      onClick={handleLike}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-white/20 hover:bg-white/30"
                    onClick={handleMoreInfo}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs">
                  <span className="text-netflix-red font-bold mr-2">98% Match</span>
                  <span className="border px-1 text-[10px] mr-2">TV-MA</span>
                  <span>2h 15m</span>
                </div>
                <div className="text-xs mt-1 flex flex-wrap gap-1">
                  <span>Action</span>
                  <span>•</span>
                  <span>Adventure</span>
                  <span>•</span>
                  <span>Drama</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Title (only shown when not hovered) */}
        {!isHovered && (
          <div className="p-2">
            <h3 className="text-sm font-medium truncate">{title}</h3>
          </div>
        )}
      </div>
    </div>
  )
}
