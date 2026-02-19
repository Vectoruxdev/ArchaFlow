"use client"

import { Star } from "lucide-react"
import { SpotlightCard } from "./spotlight-card"
import { ScrollAnimation, StaggerContainer, StaggerItem } from "./scroll-animation"

const testimonials = [
  {
    quote:
      "ArchaFlow replaced three tools we were using. Our PMs spend less time on admin and more time actually managing projects.",
    name: "Sarah Chen",
    role: "Principal Architect",
    firm: "45-person firm",
    initials: "SC",
    stars: 5,
  },
  {
    quote:
      "The budget tracking alone paid for itself. We caught a $50K overrun before it became a $200K problem.",
    name: "Marcus Rivera",
    role: "Project Manager",
    firm: "120-person firm",
    initials: "MR",
    stars: 5,
  },
  {
    quote:
      "We evaluated six PM tools. ArchaFlow was the only one that actually understood how architecture firms work.",
    name: "Emily Okafor",
    role: "Director of Operations",
    firm: "30-person firm",
    initials: "EO",
    stars: 5,
  },
]

export function Testimonials() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <ScrollAnimation className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 mb-4">
            Testimonials
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Loved by{" "}
            <span className="text-gray-500">architecture teams</span>
          </h2>
        </ScrollAnimation>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <StaggerItem key={t.name}>
              <SpotlightCard className="p-6 h-full flex flex-col">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-sm text-gray-300 leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/[0.06]">
                  <div className="w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center text-xs font-semibold text-gray-400">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-xs text-gray-500">
                      {t.role} · {t.firm}
                    </p>
                  </div>
                </div>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
