import { Suspense } from "react"
import { notFound } from "next/navigation"
import NetflixLayout from "@/components/netflix-layout"
import MovieDetail from "@/components/movie-detail"
import ContentRow from "@/components/content-row"
import { Skeleton } from "@/components/ui/skeleton"

interface MovieDetailPageProps {
  params: Promise<{
    mediaType: string
    id: string
  }>
}

export default async function MovieDetailPage({ params }: MovieDetailPageProps) {
  const resolvedParams = await params

  // Validate media type
  if (resolvedParams.mediaType !== "movie" && resolvedParams.mediaType !== "tv") {
    notFound()
  }

  return (
    <NetflixLayout>
      <div className="pt-16">
        <Suspense fallback={<DetailSkeleton />}>
          <MovieDetail mediaType={resolvedParams.mediaType} id={resolvedParams.id} />
        </Suspense>

        <div className="container mx-auto px-4 py-8 space-y-8">
          <Suspense fallback={<RowSkeleton title="Similar Titles" />}>
            <ContentRow title="Similar Titles" endpoint={`${resolvedParams.mediaType}/${resolvedParams.id}/similar`} />
          </Suspense>

          <Suspense fallback={<RowSkeleton title="Recommended" />}>
            <ContentRow
              title="Recommended"
              endpoint={`${resolvedParams.mediaType}/${resolvedParams.id}/recommendations`}
            />
          </Suspense>
        </div>
      </div>
    </NetflixLayout>
  )
}

function DetailSkeleton() {
  return (
    <div className="relative h-[70vh] bg-netflix-black">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-netflix-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  )
}

function RowSkeleton({ title }: { title: string }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold netflix-title">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-md" />
          ))}
      </div>
    </div>
  )
}
