"use client"

import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { ScrollAnimation } from "./scroll-animation"

const benefits = [
  "Free forever plan available",
  "No credit card required",
  "Set up in under 5 minutes",
  "Cancel anytime",
]

export function CTASection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <ScrollAnimation>
          <div className="relative rounded-3xl border border-white/[0.1] bg-gradient-to-b from-white/[0.04] to-transparent p-8 md:p-16 text-center overflow-hidden">
            {/* Background radial gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />

            <div className="relative z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.1] bg-[--af-bg-surface]/[0.03] mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-signal-pulse absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[--af-info-bg]0" />
                </span>
                <span className="text-sm text-[--af-text-muted]">
                  Limited spots for onboarding this month
                </span>
              </div>

              {/* Headline */}
              <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                See your projects differently.
                <br />
                <span className="text-[--af-text-muted]">Starting now.</span>
              </h2>

              {/* Benefits */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8">
                {benefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-center gap-2 text-sm text-[--af-text-muted]"
                  >
                    <Check className="w-4 h-4 text-green-400" />
                    {benefit}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-10">
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2 px-8 py-3.5 bg-[--af-bg-surface] text-foreground font-medium rounded-full hover:bg-[--af-bg-surface-alt] transition-all text-base"
                >
                  Start Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <p className="mt-4 text-xs text-[--af-text-secondary]">
                Join 500+ architecture firms already using ArchaFlow
              </p>
            </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  )
}
