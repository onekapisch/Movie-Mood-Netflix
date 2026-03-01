import type { Metadata } from "next"
import Layout from "@/components/netflix-layout"
import RecommendationEngine from "@/components/recommendation-engine"

export const metadata: Metadata = {
  title: "Get Recommendations - MovieMood",
  description:
    "Find personalized movie recommendations based on your mood, streaming platform, and preferences. No more endless scrolling.",
  keywords: ["movie recommendations", "mood-based movies", "Netflix recommendations", "what to watch"],
}

interface PageProps {
  searchParams: Promise<{
    mood?: string
    genres?: string
    runtime?: string
    rating?: string
    sort?: string
    window?: string
    lang?: string
    with?: string
    service?: string
    country?: string
    auto?: string
  }>
}

export default async function RecommendationsPage({ searchParams }: PageProps) {
  const params = await searchParams

  const initialMood = params.mood || undefined
  const initialGenres = params.genres ? params.genres.split(",").filter(Boolean) : []
  const initialRuntime = params.runtime ? Number(params.runtime) : 120
  const initialRating = params.rating ? Number(params.rating) : 6.5
  const initialSort = params.sort || "best_match"
  const initialReleaseWindow = params.window || "any"
  const initialLanguage = params.lang || "any"
  const initialWatchWith = params.with || "solo"
  const autoSearch = params.auto === "1" && !!initialMood

  return (
    <Layout>
      <section className="py-20 min-h-screen relative overflow-hidden">
        {/* Ambient glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-[0.06] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, #E50914, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        <div className="container px-4 relative">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-netflix-red/60 mb-3">
              Personalized for you
            </p>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
              What are you watching tonight?
            </h1>
            <p className="text-white/40 max-w-xl mx-auto leading-relaxed">
              Tell us your mood, pick your platform, and we will find the perfect film available right now in your country.
            </p>
          </div>

          <RecommendationEngine
            initialMood={initialMood}
            initialGenres={initialGenres}
            initialRuntime={initialRuntime}
            initialRating={initialRating}
            initialSort={initialSort}
            initialReleaseWindow={initialReleaseWindow}
            initialLanguage={initialLanguage}
            initialWatchWith={initialWatchWith}
            autoSearch={autoSearch}
          />
        </div>
      </section>
    </Layout>
  )
}
