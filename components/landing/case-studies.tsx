"use client"

import { ArrowRight } from "lucide-react"
import { SpotlightCard } from "./spotlight-card"
import { ScrollAnimation, StaggerContainer, StaggerItem } from "./scroll-animation"

const studies = [
  {
    firm: "Apex Architecture",
    size: "45 person firm",
    metric: "40% faster delivery",
    signal: "Phase tracking",
    signalColor: "bg-blue-400",
    description:
      "By implementing ArchaFlow's automated phase tracking, Apex reduced their average project delivery time by 40% in the first quarter.",
  },
  {
    firm: "Studio Vanguard",
    size: "120 person firm",
    metric: "+60% team utilization",
    signal: "Workload balancing",
    signalColor: "bg-purple-400",
    description:
      "Studio Vanguard used workload balancing to redistribute tasks across teams, boosting utilization from 55% to 88%.",
  },
  {
    firm: "Blueprint Partners",
    size: "25 person firm",
    metric: "100% on-budget",
    signal: "Real-time budget alerts",
    signalColor: "bg-green-400",
    description:
      "With real-time budget alerts and forecasting, Blueprint Partners achieved a 100% on-budget delivery rate across 12 projects.",
  },
]

export function CaseStudies() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <ScrollAnimation className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 mb-4">
            Case Studies
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Real firms.{" "}
            <span className="text-gray-500">Real results.</span>
          </h2>
        </ScrollAnimation>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {studies.map((study) => (
            <StaggerItem key={study.firm}>
              <SpotlightCard className="p-6 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-2 h-2 rounded-full ${study.signalColor}`} />
                  <span className="text-xs text-gray-500">{study.signal}</span>
                </div>

                <h3 className="text-3xl font-bold text-white mb-1">
                  {study.metric}
                </h3>
                <p className="text-sm font-medium text-gray-300">{study.firm}</p>
                <p className="text-xs text-gray-600 mb-4">{study.size}</p>

                <p className="text-sm text-gray-400 leading-relaxed flex-1">
                  {study.description}
                </p>

                <a
                  href="#"
                  className="group flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mt-4"
                >
                  Read case study
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
