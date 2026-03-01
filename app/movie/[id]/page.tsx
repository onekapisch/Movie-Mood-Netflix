import type { Metadata } from "next"
import MovieDetail from "@/components/movie-detail"
import Layout from "@/components/netflix-layout"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params

  try {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}`, {
      next: { revalidate: 3600 },
    })
    const movie = await response.json()

    if (!movie.id) throw new Error("not found")

    const title = movie.title || "Movie"
    const description = movie.overview || "View movie details on MovieMood"
    const posterUrl = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : undefined

    return {
      title: `${title} - MovieMood`,
      description,
      openGraph: {
        title: `${title} - MovieMood`,
        description,
        images: posterUrl ? [{ url: posterUrl, width: 500, alt: title }] : [],
        type: "video.movie",
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} - MovieMood`,
        description,
        images: posterUrl ? [posterUrl] : [],
      },
    }
  } catch {
    return {
      title: "Movie Details - MovieMood",
      description: "View movie details on MovieMood",
    }
  }
}

async function getMovieJsonLd(id: string) {
  try {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}`, {
      next: { revalidate: 3600 },
    })
    const movie = await response.json()
    if (!movie.id) return null

    return {
      "@context": "https://schema.org",
      "@type": "Movie",
      name: movie.title,
      description: movie.overview,
      datePublished: movie.release_date,
      image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
      aggregateRating: movie.vote_average
        ? {
            "@type": "AggregateRating",
            ratingValue: movie.vote_average.toFixed(1),
            ratingCount: movie.vote_count,
            bestRating: "10",
            worstRating: "0",
          }
        : undefined,
      genre: (movie.genres || []).map((g: { name: string }) => g.name),
      duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
    }
  } catch {
    return null
  }
}

export default async function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const jsonLd = await getMovieJsonLd(id)

  return (
    <Layout>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <MovieDetail id={id} />
    </Layout>
  )
}
