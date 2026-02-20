"use client"

import { useCallback, useEffect, useState } from "react"
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

  const fetchBusiness = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, { cache: "no-store" })
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
  }, [id])

  useEffect(() => {
    fetchBusiness()
  }, [fetchBusiness])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-[--af-bg-surface-alt] dark:bg-warm-800 rounded animate-pulse" />
        <div className="h-64 bg-[--af-bg-surface-alt] dark:bg-warm-800 rounded animate-pulse" />
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
        <p className="text-[--af-text-muted]">{error || "Business not found"}</p>
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
        <h1 className="text-2xl font-display font-bold tracking-tight">{business.name}</h1>
      </div>

      <BusinessDetailTabs business={business} onRefresh={fetchBusiness} />
    </div>
  )
}
