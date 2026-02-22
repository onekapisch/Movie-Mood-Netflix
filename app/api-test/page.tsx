import { notFound } from "next/navigation"
import ApiTest from "@/components/api-test"

export default function ApiTestPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound()
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">API Integration Test</h1>
      <ApiTest />
    </div>
  )
}
