"use client"

import { useState } from "react"
import Link from "next/link"
import { Trash2, BookmarkX, Star, Calendar, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Layout from "@/components/netflix-layout"
import { useWatchlist } from "@/hooks/use-watchlist"

export default function WatchlistPage() {
  const { watchlist, removeFromWatchlist, clearWatchlist, initialized } = useWatchlist()
  const [confirmClear, setConfirmClear] = useState(false)

  if (!initialized) {
    return (
      <Layout>
        <div className="pt-24 pb-16 min-h-screen">
          <div className="container px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-12">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="shimmer rounded-xl aspect-[2/3]" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="pt-24 pb-16 min-h-screen">
        {/* Ambient background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div
            className="glow-orb w-[600px] h-[600px] opacity-[0.04]"
            style={{ background: "#E50914", top: "-200px", left: "-200px" }}
          />
          <div
            className="glow-orb w-[400px] h-[400px] opacity-[0.03]"
            style={{ background: "#E50914", bottom: "0", right: "-100px" }}
          />
        </div>

        <div className="container px-4 relative">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 animate-fade-in-up">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-netflix-red mb-2 opacity-80">
                Your Collection
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                My Watchlist
              </h1>
              {watchlist.length > 0 && (
                <p className="text-muted-foreground mt-2 text-sm">
                  {watchlist.length} {watchlist.length === 1 ? "title" : "titles"} saved
                </p>
              )}
            </div>

            {watchlist.length > 0 && (
              <div className="flex gap-3">
                {confirmClear ? (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        clearWatchlist()
                        setConfirmClear(false)
                      }}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Yes, clear all
                    </Button>
                    <Button size="sm" variant="outline" className="glass-button" onClick={() => setConfirmClear(false)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="glass-button gap-2 text-muted-foreground"
                    onClick={() => setConfirmClear(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear all
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Empty state */}
          {watchlist.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in-up">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                style={{ background: "rgba(229,9,20,0.08)", border: "1px solid rgba(229,9,20,0.15)" }}
              >
                <BookmarkX className="h-10 w-10 text-netflix-red opacity-60" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-white">Nothing saved yet</h2>
              <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
                Start exploring and tap the bookmark icon on any movie to save it here for later.
              </p>
              <div className="flex gap-3 flex-wrap justify-center">
                <Link href="/recommendations">
                  <Button className="glow-button rounded-xl px-6">Get Recommendations</Button>
                </Link>
                <Link href="/discover">
                  <Button variant="outline" className="glass-button rounded-xl px-6">
                    Browse Movies
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Watchlist grid */}
          {watchlist.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 stagger-children">
              {watchlist.map((item) => (
                <WatchlistCard key={item.id} item={item} onRemove={removeFromWatchlist} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

function WatchlistCard({
  item,
  onRemove,
}: {
  item: import("@/hooks/use-watchlist").WatchlistItem
  onRemove: (id: number) => void
}) {
  const [hovered, setHovered] = useState(false)
  const addedDate = new Date(item.added_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
  const releaseYear = item.release_date ? new Date(item.release_date).getFullYear() : null

  return (
    <div
      className="movie-card-premium group animate-fade-in-up relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Poster */}
      <Link href={`/${item.media_type}/${item.id}`}>
        <div className="aspect-[2/3] relative overflow-hidden rounded-t-xl">
          {item.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-white/5 flex items-center justify-center">
              <span className="text-3xl font-bold text-white/20">{item.title.charAt(0)}</span>
            </div>
          )}

          {/* Hover overlay */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300"
            style={{
              opacity: hovered ? 1 : 0,
              background: "linear-gradient(to top, rgba(5,5,8,0.95) 0%, rgba(5,5,8,0.5) 60%, transparent 100%)",
            }}
          >
            <div className="flex flex-col items-center gap-3 pb-4">
              <Link href={`/${item.media_type}/${item.id}`}>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                  style={{ background: "#E50914", boxShadow: "0 0 20px rgba(229,9,20,0.5)" }}
                >
                  <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                </div>
              </Link>
            </div>
          </div>

          {/* Rating badge */}
          {item.vote_average > 0 && (
            <div className="absolute top-2 left-2">
              <div className="flex items-center gap-1 frosted-tag px-2 py-1">
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-bold text-white">{item.vote_average.toFixed(1)}</span>
              </div>
            </div>
          )}

          {/* Remove button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              onRemove(item.id)
            }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110"
            style={{
              background: "rgba(229,9,20,0.85)",
              border: "1px solid rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
            }}
            aria-label="Remove from watchlist"
          >
            <Trash2 className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      </Link>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-white truncate leading-tight mb-1">{item.title}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {releaseYear && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {releaseYear}
              </span>
            )}
          </div>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 capitalize border-white/10 text-white/40"
          >
            {item.media_type}
          </Badge>
        </div>
        <p className="text-[10px] text-white/25 mt-1.5">Added {addedDate}</p>
      </div>
    </div>
  )
}
