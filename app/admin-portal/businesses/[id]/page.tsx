"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BusinessDetailTabs } from "@/components/admin/business-detail-tabs"

export default function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const res = await fetch(`/api/admin/businesses/${id}`)
        if (res.ok) {
          setBusiness(await res.json())
        } else {
          setError("Business not found")
        }
      } catch {
        setError("Failed to load business")
      } finally {
        setLoading(false)
      }
    }
    fetchBusiness()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    )
  }

  if (error || !business) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/businesses")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Businesses
        </Button>
        <p className="text-gray-500">{error || "Business not found"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/businesses")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{business.name}</h1>
      </div>

      <BusinessDetailTabs business={business} />
    </div>
  )
}
