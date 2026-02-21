import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get("endpoint")
  const query = searchParams.get("query")

  const TMDB_API_KEY = process.env.TMDB_API_KEY
  const TMDB_BASE_URL = "https://api.themoviedb.org/3"

  if (!TMDB_API_KEY) {
    console.error("TMDB API key not configured")
    return NextResponse.json(
      {
        error: "TMDB_API_KEY_MISSING",
        status_message:
          "TMDB API key is not configured on the server. Add TMDB_API_KEY to your environment variables and restart.",
      },
      { status: 500 },
    )
  }

  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint parameter" }, { status: 400 })
  }

  try {
    let url = `${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}`

    if (query) {
      url += `&query=${encodeURIComponent(query)}`
    }

    // Add additional parameters from the request
    searchParams.forEach((value, key) => {
      if (key !== "endpoint" && key !== "query") {
        url += `&${key}=${encodeURIComponent(value)}`
      }
    })

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      console.error("TMDB upstream error", {
        endpoint,
        status: response.status,
        statusMessage: data?.status_message,
      })

      return NextResponse.json(
        {
          error: "TMDB_UPSTREAM_ERROR",
          upstream_status: response.status,
          status_message: data?.status_message || `TMDB API error: ${response.status}`,
        },
        { status: response.status },
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("TMDB API error:", error)
    return NextResponse.json(
      {
        error: "TMDB_REQUEST_FAILED",
        status_message: "Could not fetch data from TMDB at this time. Please try again later.",
      },
      { status: 502 },
    )
  }
}
