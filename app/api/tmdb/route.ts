import { NextResponse } from "next/server"
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit"

const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_PROXY_RATE_LIMIT = { limit: 90, windowMs: 60_000 }

const ALLOWED_ENDPOINT_PATTERNS = [
  /^configuration$/,
  /^search\/(multi|movie|tv)$/,
  /^discover\/(movie|tv)$/,
  /^trending\/(all|movie|tv)\/(day|week)$/,
  /^genre\/(movie|tv)\/list$/,
  /^(movie|tv)\/\d+$/,
  /^(movie|tv)\/\d+\/(similar|recommendations|videos|credits|watch\/providers|external_ids)$/,
]

const ALLOWED_QUERY_PARAMS = new Set([
  "append_to_response",
  "include_adult",
  "language",
  "page",
  "query",
  "region",
  "sort_by",
  "vote_average.gte",
  "vote_average.lte",
  "vote_count.gte",
  "vote_count.lte",
  "with_genres",
  "with_original_language",
  "with_watch_providers",
  "watch_monetization_types",
  "watch_region",
  "primary_release_date.gte",
  "primary_release_date.lte",
  "first_air_date.gte",
  "first_air_date.lte",
  "release_date.gte",
  "release_date.lte",
  "with_runtime.lte",
  "with_runtime.gte",
  "year",
  "primary_release_year",
])

function isAllowedEndpoint(endpoint: string) {
  return ALLOWED_ENDPOINT_PATTERNS.some((pattern) => pattern.test(endpoint))
}

function sanitizeEndpoint(rawEndpoint: string) {
  const endpoint = rawEndpoint.trim().replace(/^\/+/, "")

  if (!endpoint) return null
  if (endpoint.includes("?")) return null
  if (endpoint.includes("..")) return null
  if (endpoint.includes("://")) return null

  return endpoint
}

function buildTmdbUrl(endpoint: string, searchParams: URLSearchParams, apiKey: string) {
  const url = new URL(`${TMDB_BASE_URL}/${endpoint}`)
  url.searchParams.set("api_key", apiKey)

  searchParams.forEach((value, key) => {
    if (key === "endpoint" || key === "api_key") {
      return
    }

    if (!ALLOWED_QUERY_PARAMS.has(key)) {
      return
    }

    if (value.length > 300) {
      return
    }

    if (key === "page") {
      const page = Number(value)
      if (!Number.isInteger(page) || page < 1 || page > 10) {
        return
      }
    }

    url.searchParams.append(key, value)
  })

  return url
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawEndpoint = searchParams.get("endpoint")

  const TMDB_API_KEY = process.env.TMDB_API_KEY

  const ip = getRequestIp(request)
  const rateLimit = checkRateLimit({
    key: `tmdb:${ip}`,
    ...TMDB_PROXY_RATE_LIMIT,
  })

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "RATE_LIMITED",
        status_message: "Too many requests. Please wait a moment and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    )
  }

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

  if (!rawEndpoint) {
    return NextResponse.json({ error: "Missing endpoint parameter" }, { status: 400 })
  }

  const endpoint = sanitizeEndpoint(rawEndpoint)

  if (!endpoint || !isAllowedEndpoint(endpoint)) {
    return NextResponse.json(
      {
        error: "INVALID_ENDPOINT",
        status_message: "This TMDB endpoint is not allowed by the proxy.",
      },
      { status: 400 },
    )
  }

  try {
    const url = buildTmdbUrl(endpoint, searchParams, TMDB_API_KEY)

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: endpoint.startsWith("search/") ? 60 : 3600 },
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      console.error("TMDB upstream error", {
        endpoint,
        status: response.status,
        statusMessage: data?.status_message,
        ip,
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
    console.error("TMDB API error:", { endpoint, ip, error })
    return NextResponse.json(
      {
        error: "TMDB_REQUEST_FAILED",
        status_message: "Could not fetch data from TMDB at this time. Please try again later.",
      },
      { status: 502 },
    )
  }
}
