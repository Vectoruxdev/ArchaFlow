"use client"

import { ScrollAnimation } from "./scroll-animation"

const firms = [
  "Foster + Partners",
  "Gensler",
  "BIG",
  "Zaha Hadid Architects",
  "SOM",
  "MVRDV",
  "OMA",
  "Heatherwick Studio",
  "Snohetta",
  "NBBJ",
  "KPF",
  "Perkins&Will",
]

export function TrustBar() {
  return (
    <section className="py-16 border-y border-white/[0.06]">
      <ScrollAnimation>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-600 mb-8">
          Trusted by architecture firms worldwide
        </p>
      </ScrollAnimation>

      <div className="relative overflow-hidden">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-black to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-black to-transparent z-10" />

        {/* Scrolling track */}
        <div className="flex animate-marquee">
          {[...firms, ...firms].map((firm, i) => (
            <div
              key={`${firm}-${i}`}
              className="flex-shrink-0 px-8 flex items-center"
            >
              <span className="text-lg font-semibold text-gray-700 whitespace-nowrap tracking-tight">
                {firm}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
