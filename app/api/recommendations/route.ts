import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { z } from "zod"

const requestSchema = z.object({
  userId: z.string().min(1),
  preferences: z
    .object({
      genres: z.array(z.string()).default([]),
      directors: z.array(z.string()).default([]),
      actors: z.array(z.string()).default([]),
    })
    .default({ genres: [], directors: [], actors: [] }),
  watchHistory: z.array(z.union([z.string(), z.number()])).default([]),
  currentMood: z.string().optional(),
  timeAvailable: z.number().int().positive().optional(),
})

type CatalogContent = {
  id: string | number
  genres?: string[]
  director?: string
  cast?: string[]
  runtime?: number
}

// Sample algorithm weights - in production you'd tune these based on user data
const WEIGHTS = {
  genre: 0.4,
  director: 0.2,
  actor: 0.2,
  releaseYear: 0.1,
  userRating: 0.3,
  popularity: 0.2,
  watchHistory: 0.5,
  timeOfDay: 0.1,
  weekday: 0.1,
  contentLength: 0.2,
}

export async function POST(request: Request) {
  try {
    const parsedBody = requestSchema.safeParse(await request.json())

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid recommendation request" }, { status: 400 })
    }

    const { userId, preferences, watchHistory, currentMood, timeAvailable } = parsedBody.data

    // Fetch user data from KV store
    const userData = await kv.get(`user:${userId}`)
    void userData

    // Get time context
    const now = new Date()
    const hour = now.getHours()
    const weekday = now.getDay()

    // Fetch content catalog (in production, this would be from a database)
    const rawCatalog = await kv.get("netflix:catalog")

    if (!Array.isArray(rawCatalog)) {
      return NextResponse.json({ error: "Content catalog not available" }, { status: 500 })
    }

    const catalog = rawCatalog as CatalogContent[]

    // Apply multi-factor recommendation algorithm
    const recommendations = catalog.map((content) => {
      let score = 0
      const contentGenres = Array.isArray(content.genres) ? content.genres : []
      const contentCast = Array.isArray(content.cast) ? content.cast : []
      const contentRuntime = typeof content.runtime === "number" ? content.runtime : undefined

      // Genre match
      if (preferences.genres.some((g) => contentGenres.includes(g))) {
        score += WEIGHTS.genre
      }

      // Director match
      if (content.director && preferences.directors.includes(content.director)) {
        score += WEIGHTS.director
      }

      // Actor match
      if (contentCast.some((actor) => preferences.actors.includes(actor))) {
        score += WEIGHTS.actor
      }

      // Content length appropriate for available time
      if (timeAvailable && contentRuntime !== undefined && contentRuntime <= timeAvailable) {
        score += WEIGHTS.contentLength
      }

      // Mood matching
      if (currentMood === "happy" && (contentGenres.includes("comedy") || contentGenres.includes("family"))) {
        score += 0.3
      } else if (
        currentMood === "thoughtful" &&
        (contentGenres.includes("drama") || contentGenres.includes("documentary"))
      ) {
        score += 0.3
      }

      // Time of day context
      if ((hour >= 20 || hour <= 2) && contentGenres.includes("horror")) {
        score += WEIGHTS.timeOfDay // Horror movies score higher at night
      }

      // Weekend vs weekday
      if ((weekday === 0 || weekday === 6) && contentRuntime !== undefined && contentRuntime > 120) {
        score += WEIGHTS.weekday // Longer movies score higher on weekends
      }

      // Avoid recently watched content
      if (watchHistory.includes(content.id)) {
        score -= 0.5
      }

      return {
        ...content,
        score,
      }
    })

    // Sort by score and return top recommendations
    const topRecommendations = recommendations.sort((a, b) => b.score - a.score).slice(0, 10)

    return NextResponse.json({ recommendations: topRecommendations })
  } catch (error) {
    console.error("Recommendation error:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}
