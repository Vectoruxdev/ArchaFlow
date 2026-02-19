"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { isSupabaseConfigured } from "@/lib/supabase/client"
import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { DataFlowViz } from "@/components/landing/data-flow-viz"
import { TrustBar } from "@/components/landing/trust-bar"
import { FeatureCards } from "@/components/landing/feature-cards"
import { WorkflowTimeline } from "@/components/landing/workflow-timeline"
import { BentoGrid } from "@/components/landing/bento-grid"
import { CaseStudies } from "@/components/landing/case-studies"
import { Testimonials } from "@/components/landing/testimonials"
import { Pricing } from "@/components/landing/pricing"
import { FAQ } from "@/components/landing/faq"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"

export default function HomePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [showLanding, setShowLanding] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      router.replace("/workflow")
      return
    }

    if (!authLoading) {
      if (user) {
        router.replace("/workflow")
      } else {
        // Not logged in — show landing page
        setShowLanding(true)
      }
      return
    }

    // Auth still loading: after 1.5s max, show landing page
    const timeout = setTimeout(() => {
      setShowLanding(true)
    }, 1500)
    return () => clearTimeout(timeout)
  }, [authLoading, user, router])

  // Loading state while auth resolves
  if (!showLanding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center animate-pulse">
            <div className="w-5 h-5 border-2 border-black rotate-45" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      <Navbar />
      <Hero />
      <DataFlowViz />
      <TrustBar />
      <FeatureCards />
      <WorkflowTimeline />
      <BentoGrid />
      <CaseStudies />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTASection />
      <Footer />
    </div>
  )
}
