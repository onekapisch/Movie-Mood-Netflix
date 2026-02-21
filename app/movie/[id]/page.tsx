import type { Metadata } from "next"
import MovieDetail from "@/components/movie-detail"
import Layout from "@/components/netflix-layout"

// Dynamic metadata for movie pages
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params

  // Fetch movie data
  try {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}`)
    const movie = await response.json()

    return {
      title: `${movie.title} - MovieMood`,
      description: movie.overview || "View movie details on MovieMood",
    }
  } catch (error) {
    return {
      title: "Movie Details - MovieMood",
      description: "View movie details on MovieMood",
    }
  }
}

export default async function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <Layout>
      <MovieDetail id={id} />
    </Layout>
  )
}
