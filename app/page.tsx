import Layout from "@/components/netflix-layout"
import WelcomeHero from "@/components/welcome-hero"
import RecommendationEngine from "@/components/recommendation-engine"
import HowItWorks from "@/components/how-it-works"
import NewReleases from "@/components/new-releases"
import FeaturedMovies from "@/components/featured-movies"

export default function Home() {
  return (
    <Layout>
      <WelcomeHero />

      {/* Quick recommendation section */}
      <section className="py-16 relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(229,9,20,0.04), transparent)",
          }}
        />
        <div className="container px-4 relative">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-netflix-red/60 mb-3">
              Start here
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Find your perfect match
            </h2>
          </div>
          <RecommendationEngine />
        </div>
      </section>

      <HowItWorks />

      {/* New Releases — live content filtered by selected service + country */}
      <NewReleases />

      <FeaturedMovies />
    </Layout>
  )
}
