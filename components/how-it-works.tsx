import { HeartIcon, SearchIcon, FilmIcon } from "lucide-react"

const STEPS = [
  {
    icon: HeartIcon,
    step: "01",
    title: "Tell us your mood",
    description:
      "Whether you're feeling happy, sad, thoughtful, or energetic — pick your emotional state and we'll translate it into the perfect genre mix.",
    color: "rgba(229,9,20,0.1)",
    borderColor: "rgba(229,9,20,0.18)",
    iconColor: "#E50914",
  },
  {
    icon: SearchIcon,
    step: "02",
    title: "Set your preferences",
    description:
      "Choose your streaming platform, country, runtime, genres, and advanced filters to nail down exactly what you want tonight.",
    color: "rgba(99,102,241,0.1)",
    borderColor: "rgba(99,102,241,0.18)",
    iconColor: "#818cf8",
  },
  {
    icon: FilmIcon,
    step: "03",
    title: "Get perfect matches",
    description:
      "Receive handpicked recommendations available right now on your chosen platform, with real match scores and AI-powered insights.",
    color: "rgba(16,185,129,0.1)",
    borderColor: "rgba(16,185,129,0.14)",
    iconColor: "#10b981",
  },
]

export default function HowItWorks() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Subtle background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(229,9,20,0.04), transparent)",
        }}
      />

      <div className="container px-4 relative">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-netflix-red/70 mb-3">
            How it works
          </p>
          <h2
            className="text-3xl md:text-4xl font-extrabold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Three steps to your perfect film
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {STEPS.map((step, i) => (
            <div
              key={step.step}
              className="relative rounded-2xl p-6 animate-fade-in-up"
              style={{
                background: "var(--glass-bg)",
                border: `1px solid ${step.borderColor}`,
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                animationDelay: `${i * 120}ms`,
                boxShadow: "var(--glass-shadow), inset 0 1px 0 var(--glass-highlight)",
              }}
            >
              {/* Step number */}
              <div
                className="text-6xl font-black absolute top-4 right-5 select-none pointer-events-none"
                style={{ color: step.iconColor, opacity: 0.07 }}
              >
                {step.step}
              </div>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: step.color, border: `1px solid ${step.borderColor}` }}
              >
                <step.icon className="h-5 w-5" style={{ color: step.iconColor }} />
              </div>

              <h3 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {step.description}
              </p>

              {/* Connector dot — shown between cards on desktop */}
              {i < STEPS.length - 1 && (
                <div
                  className="hidden md:flex absolute top-1/2 -right-3 w-6 h-6 rounded-full -translate-y-1/2 z-10 items-center justify-center"
                  style={{
                    background: "rgba(229,9,20,0.15)",
                    border: "1px solid rgba(229,9,20,0.25)",
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-netflix-red" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
