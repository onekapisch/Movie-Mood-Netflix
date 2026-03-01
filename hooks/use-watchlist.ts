"use client"

import { useState, useEffect, useCallback } from "react"

export interface WatchlistItem {
  id: number
  title: string
  poster_path: string | null
  media_type: "movie" | "tv"
  vote_average: number
  release_date?: string
  genre_ids?: number[]
  added_at: string
}

const WATCHLIST_KEY = "movie_mood_watchlist"
const LIKED_KEY = "movie_mood_liked"

function safeLocalStorageGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeLocalStorageSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [liked, setLiked] = useState<number[]>([])
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    setWatchlist(safeLocalStorageGet<WatchlistItem[]>(WATCHLIST_KEY, []))
    setLiked(safeLocalStorageGet<number[]>(LIKED_KEY, []))
    setInitialized(true)
  }, [])

  const addToWatchlist = useCallback((item: Omit<WatchlistItem, "added_at">) => {
    setWatchlist((prev) => {
      if (prev.some((m) => m.id === item.id)) return prev
      const updated = [{ ...item, added_at: new Date().toISOString() }, ...prev]
      safeLocalStorageSet(WATCHLIST_KEY, updated)
      return updated
    })
  }, [])

  const removeFromWatchlist = useCallback((id: number) => {
    setWatchlist((prev) => {
      const updated = prev.filter((m) => m.id !== id)
      safeLocalStorageSet(WATCHLIST_KEY, updated)
      return updated
    })
  }, [])

  const isInWatchlist = useCallback(
    (id: number) => watchlist.some((m) => m.id === id),
    [watchlist],
  )

  const toggleLike = useCallback((id: number) => {
    setLiked((prev) => {
      const updated = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      safeLocalStorageSet(LIKED_KEY, updated)
      return updated
    })
  }, [])

  const isLiked = useCallback((id: number) => liked.includes(id), [liked])

  const clearWatchlist = useCallback(() => {
    setWatchlist([])
    safeLocalStorageSet(WATCHLIST_KEY, [])
  }, [])

  return {
    watchlist,
    liked,
    initialized,
    watchlistCount: watchlist.length,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    toggleLike,
    isLiked,
    clearWatchlist,
  }
}
