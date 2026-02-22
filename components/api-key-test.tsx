"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle } from "lucide-react"

export default function ApiKeyTest() {
  const [isLoading, setIsLoading] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function testApiKey() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/tmdb?endpoint=configuration")

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        // If we get a valid response with images configuration, the API key is working
        if (data.images) {
          setIsValid(true)
        } else {
          throw new Error("Invalid API response format")
        }
      } catch (error: any) {
        console.error("API key test error:", error)
        setError(error.message)
        setIsValid(false)
      } finally {
        setIsLoading(false)
      }
    }

    testApiKey()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          TMDB API Key Status
          {!isLoading &&
            (isValid ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-netflix-red" />
            ))}
        </CardTitle>
        <CardDescription>Verifying your TMDB API key configuration</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2">Testing API key...</span>
          </div>
        ) : isValid ? (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
            <h3 className="font-medium text-green-700 dark:text-green-300 mb-1">API Key is Valid</h3>
            <p className="text-sm text-green-600 dark:text-green-400">
              Your TMDB API key is correctly configured and working. You can now use all features of MovieMood.
            </p>
          </div>
        ) : (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
            <h3 className="font-medium text-red-700 dark:text-red-300 mb-1">API Key Error</h3>
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">
              There was a problem with your TMDB API key: {error}
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              Please check your .env.local file and make sure the TMDB_API_KEY is set correctly.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">Server-side TMDB configuration check</div>
        {isValid && <Badge className="bg-green-500">Ready to use</Badge>}
      </CardFooter>
    </Card>
  )
}
