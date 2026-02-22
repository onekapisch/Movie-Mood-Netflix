import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit"

const requestSchema = z.object({
  movieId: z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)]).optional(),
  title: z.string().trim().min(1).max(200),
  overview: z.string().trim().min(1).max(4000),
  genres: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
})

const analysisSchema = z.object({
  mood: z.array(z.string()).max(5),
  themes: z.array(z.string()).max(10),
  similarContent: z.array(z.string()).max(10),
  viewingContext: z.array(z.string()).max(6),
  contentWarnings: z.array(z.string()).max(10),
  analysis: z.string().max(2000),
})

export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request)
    const rateLimit = checkRateLimit({
      key: `analyze:${ip}`,
      limit: 12,
      windowMs: 60_000,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "RATE_LIMITED",
          status_message: "Too many analysis requests. Please try again in a minute.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY_MISSING",
          status_message: "AI analysis is not configured on the server.",
        },
        { status: 503 },
      )
    }

    const body = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "INVALID_REQUEST",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const { movieId, title, overview, genres } = parsed.data

    const prompt = `
      Analyze the following movie/show and provide insights:
      
      Title: ${title}
      Overview: ${overview}
      Genres: ${genres.join(", ")}
      
      Please provide the following analysis:
      1. Mood: What mood does this content evoke? (e.g., uplifting, tense, melancholic)
      2. Themes: What are the main themes explored?
      3. Similar Content: What other movies/shows might someone enjoy if they like this?
      4. Viewing Context: When would be the best time to watch this? (e.g., date night, family movie night, solo viewing)
      5. Content Warnings: Are there any elements viewers should be aware of? (violence, emotional intensity, etc.)
      
      Format your response as JSON with the following structure:
      {
        "mood": ["primary mood", "secondary mood"],
        "themes": ["theme1", "theme2", "theme3"],
        "similarContent": ["title1", "title2", "title3"],
        "viewingContext": ["context1", "context2"],
        "contentWarnings": ["warning1", "warning2"],
        "analysis": "A paragraph with deeper insights about the content"
      }
    `

    const { object: analysis } = await generateObject({
      model: openai("gpt-4o"),
      prompt,
      schema: analysisSchema,
      temperature: 0.7,
      maxOutputTokens: 1000,
    })

    // Store the analysis in the database for future use
    // This would be implemented in a real application

    return NextResponse.json({
      movieId,
      title,
      analysis,
    })
  } catch (error) {
    console.error("Content analysis error:", error)
    return NextResponse.json(
      {
        error: "ANALYSIS_FAILED",
        status_message: "Failed to analyze content",
      },
      { status: 500 },
    )
  }
}
