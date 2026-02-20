"use client"

import { ScrollAnimation } from "./scroll-animation"
import { FolderPlus, ListChecks, BarChart3 } from "lucide-react"

const steps = [
  {
    number: "01",
    title: "Set up your project workspace",
    description:
      "Create projects, define phases, set milestones, and invite your team. ArchaFlow adapts to your firm's workflow — not the other way around.",
    accent: "border-white/30",
    accentDot: "bg-[--af-bg-surface]",
    icon: FolderPlus,
    details: [
      "Create projects with custom phases",
      "Define milestones & deadlines",
      "Invite team members & set roles",
    ],
  },
  {
    number: "02",
    title: "Assign, track, and automate",
    description:
      "Use task boards, Gantt timelines, and automated workflows to keep everything moving. Smart assignments prevent bottlenecks before they happen.",
    accent: "border-indigo-400/30",
    accentDot: "bg-indigo-400",
    icon: ListChecks,
    details: [
      "Kanban boards & Gantt charts",
      "Automated task assignments",
      "Real-time progress tracking",
    ],
  },
  {
    number: "03",
    title: "Deliver with confidence",
    description:
      "Real-time dashboards, budget tracking, and client-ready reports give you full visibility. Know exactly where every project stands.",
    accent: "border-green-400/30",
    accentDot: "bg-green-400",
    icon: BarChart3,
    details: [
      "Live project dashboards",
      "Budget alerts & forecasting",
      "One-click client reports",
    ],
  },
]

export function WorkflowTimeline() {
  return (
    <section id="workflow" className="py-24 px-4 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <ScrollAnimation className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--af-text-muted] mb-4">
            How It Works
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Three steps to{" "}
            <span className="text-[--af-text-muted]">project clarity</span>
          </h2>
        </ScrollAnimation>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-white/20 via-indigo-400/20 to-green-400/20" />

          <div className="space-y-12">
            {steps.map((step, i) => (
              <ScrollAnimation key={step.number} delay={i * 0.15}>
                <div className="flex gap-6 md:gap-10">
                  {/* Step indicator */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl border ${step.accent} bg-[--af-bg-surface]/[0.02] flex items-center justify-center`}
                    >
                      <span className="text-lg md:text-xl font-bold text-white/60">
                        {step.number}
                      </span>
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${step.accentDot}`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <step.icon className="w-4 h-4 text-[--af-text-muted]" />
                      <h3 className="text-xl md:text-2xl font-display font-bold tracking-tight text-white">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-[--af-text-muted] leading-relaxed max-w-xl">
                      {step.description}
                    </p>
                    <ul className="mt-4 space-y-2">
                      {step.details.map((detail) => (
                        <li
                          key={detail}
                          className="flex items-center gap-2 text-sm text-[--af-text-muted]"
                        >
                          <div className={`w-1 h-1 rounded-full ${step.accentDot}`} />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
