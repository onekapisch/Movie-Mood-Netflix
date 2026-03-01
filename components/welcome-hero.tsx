"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FilmIcon, HeartIcon, SparklesIcon, TrendingUpIcon } from "lucide-react"
import { useRouter } from "next/navigation"

const MOOD_PILLS = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😢", label: "Sad" },
  { emoji: "🎉", label: "Excited" },
  { emoji: "☕", label: "Relaxed" },
  { emoji: "🌙", label: "Thoughtful" },
  { emoji: "⚡", label: "Energetic" },
]

export default function WelcomeHero() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleGetStarted = () => {
    setIsLoading(true)
    router.push("/recommendations")
  }

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 transition-colors duration-300" style={{ background: "var(--page-bg)" }} />

      {/* Ambient red glow */}
      <div
        className="glow-orb w-[700px] h-[700px] -translate-x-1/2 -translate-y-1/2"
        style={{ background: "#E50914", top: "30%", left: "30%", opacity: 0.07 }}
      />
      <div
        className="glow-orb w-[400px] h-[400px]"
        style={{ background: "#E50914", bottom: "10%", right: "15%", opacity: 0.04 }}
      />

      {/* Floating glass orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { size: 220, top: "8%", left: "6%", delay: "0s", duration: "14s" },
          { size: 140, top: "15%", right: "10%", delay: "2s", duration: "18s" },
          { size: 80, top: "55%", left: "3%", delay: "4s", duration: "12s" },
          { size: 160, bottom: "10%", right: "6%", delay: "1s", duration: "16s" },
          { size: 60, bottom: "25%", left: "12%", delay: "3s", duration: "20s" },
          { size: 100, top: "40%", right: "20%", delay: "5s", duration: "15s" },
        ].map((orb, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              width: orb.size,
              height: orb.size,
              top: (orb as any).top,
              left: (orb as any).left,
              right: (orb as any).right,
              bottom: (orb as any).bottom,
              background: i % 2 === 0
                ? "radial-gradient(circle at 30% 30%, rgba(229,9,20,0.06), rgba(229,9,20,0.01))"
                : "radial-gradient(circle at 30% 30%, var(--glass-bg), transparent)",
              border: "1px solid var(--glass-border)",
              backdropFilter: "blur(2px)",
              "--delay": orb.delay,
              "--duration": orb.duration,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Noise overlay */}
      <div className="absolute inset-0 noise-overlay opacity-40 pointer-events-none" />

      {/* Main content */}
      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Top pill */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-fade-in-up"
            style={{
              background: "rgba(229,9,20,0.08)",
              border: "1px solid rgba(229,9,20,0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            <SparklesIcon className="h-3.5 w-3.5 text-netflix-red" />
            <span className="text-sm font-medium tracking-wide" style={{ color: "var(--text-secondary)" }}>
              Your personal AI movie guide
            </span>
            <TrendingUpIcon className="h-3.5 w-3.5 text-netflix-red" />
          </div>

          {/* Headline */}
          <h1
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[0.95] mb-6 animate-fade-in-up"
            style={{ color: "var(--text-primary)", animationDelay: "80ms" }}
          >
            Find films that{" "}
            <br className="hidden sm:block" />
            match your{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #E50914 0%, #ff5555 50%, #E50914 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              mood
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-in-up"
            style={{ color: "var(--text-secondary)", animationDelay: "160ms" }}
          >
            No more endless scrolling. Tell us how you feel, pick your streaming service, and get
            handpicked recommendations in seconds.
          </p>

          {/* Mood pills */}
          <div
            className="flex flex-wrap justify-center gap-2 mb-10 animate-fade-in-up"
            style={{ animationDelay: "240ms" }}
          >
            {MOOD_PILLS.map((mood) => (
              <div
                key={mood.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-default select-none"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  backdropFilter: "blur(8px)",
                  color: "var(--text-secondary)",
                }}
              >
                <span>{mood.emoji}</span>
                <span>{mood.label}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
            style={{ animationDelay: "320ms" }}
          >
            <Button
              size="lg"
              className="glow-button rounded-xl px-8 py-3 text-base font-semibold text-white gap-2 h-12"
              onClick={handleGetStarted}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Loading...
                </span>
              ) : (
                <>
                  Get Recommendations
                  <HeartIcon className="h-4 w-4" />
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="glass-button rounded-xl px-8 py-3 text-base font-semibold gap-2 h-12"
              onClick={() => router.push("/discover")}
            >
              Browse Categories
              <FilmIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Stats strip */}
          <div
            className="flex flex-wrap justify-center gap-8 mt-16 pt-8 animate-fade-in-up"
            style={{
              animationDelay: "400ms",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            {[
              { value: "8", label: "Streaming platforms" },
              { value: "30+", label: "Countries supported" },
              { value: "6", label: "Moods to choose from" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-extrabold gradient-text-red">
                  {stat.value}
                </div>
                <div
                  className="text-xs font-medium mt-0.5 tracking-wide"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, var(--page-bg))" }}
      />
    </section>
  )
}
