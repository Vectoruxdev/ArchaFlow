"use client"

import {
  LayoutDashboard,
  Workflow,
  DollarSign,
  Users,
  FolderOpen,
  Sparkles,
} from "lucide-react"
import { SpotlightCard } from "./spotlight-card"
import {
  ScrollAnimation,
  StaggerContainer,
  StaggerItem,
} from "./scroll-animation"

const features = [
  {
    icon: LayoutDashboard,
    tag: "CORE",
    tagColor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    iconColor: "text-blue-400",
    title: "Project Dashboard",
    description: "Track all projects in a single, real-time view.",
    preview: (
      <div className="mt-4 p-3 rounded-lg bg-[--af-bg-surface]/[0.03] border border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-[--af-text-muted]">Riverside Office</span>
          </div>
          <span className="text-xs text-[--af-text-secondary]">78%</span>
        </div>
        <div className="mt-2 h-1.5 bg-[--af-bg-surface]/[0.05] rounded-full overflow-hidden">
          <div className="h-full w-[78%] bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" />
        </div>
      </div>
    ),
  },
  {
    icon: Workflow,
    tag: "AUTOMATION",
    tagColor: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    iconColor: "text-purple-400",
    title: "Smart Workflows",
    description: "Automate phase transitions and task assignments.",
    preview: (
      <div className="mt-4 flex items-center gap-2">
        {["Schematic", "Design Dev", "Docs"].map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`px-2 py-1 rounded text-[10px] border ${
                i === 0
                  ? "bg-purple-400/10 border-purple-400/20 text-purple-400"
                  : "bg-[--af-bg-surface]/[0.03] border-white/[0.06] text-[--af-text-muted]"
              }`}
            >
              {step}
            </div>
            {i < 2 && (
              <div className="w-3 h-px bg-[--af-bg-surface]/[0.15]" />
            )}
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: DollarSign,
    tag: "FINANCE",
    tagColor: "text-green-400 bg-green-400/10 border-green-400/20",
    iconColor: "text-green-400",
    title: "Budget Tracking",
    description: "Monitor costs in real-time with alerts.",
    preview: (
      <div className="mt-4 p-3 rounded-lg bg-[--af-bg-surface]/[0.03] border border-white/[0.06]">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-[--af-text-muted]">Budget</span>
          <span className="text-green-400">$245K / $300K</span>
        </div>
        <div className="h-1.5 bg-[--af-bg-surface]/[0.05] rounded-full overflow-hidden">
          <div className="h-full w-[82%] bg-gradient-to-r from-green-500 to-green-400 rounded-full" />
        </div>
      </div>
    ),
  },
  {
    icon: Users,
    tag: "TEAM",
    tagColor: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    iconColor: "text-orange-400",
    title: "Team Workload",
    description: "See who's overloaded and rebalance instantly.",
    preview: (
      <div className="mt-4 space-y-2">
        {[
          { name: "JL", pct: 90, over: true },
          { name: "KS", pct: 65, over: false },
        ].map((m) => (
          <div key={m.name} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[--af-bg-surface]/[0.1] flex items-center justify-center text-[8px] text-[--af-text-muted]">
              {m.name}
            </div>
            <div className="flex-1 h-1.5 bg-[--af-bg-surface]/[0.05] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  m.over
                    ? "bg-gradient-to-r from-orange-500 to-red-400"
                    : "bg-gradient-to-r from-orange-400 to-orange-300"
                }`}
                style={{ width: `${m.pct}%` }}
              />
            </div>
            <span className={`text-[10px] ${m.over ? "text-red-400" : "text-[--af-text-muted]"}`}>
              {m.pct}%
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: FolderOpen,
    tag: "FILES",
    tagColor: "text-pink-400 bg-pink-400/10 border-pink-400/20",
    iconColor: "text-pink-400",
    title: "Document Management",
    description: "Centralized versioned file storage.",
    preview: (
      <div className="mt-4 space-y-1.5">
        {["Floor Plan v3.dwg", "Elevations.pdf"].map((file) => (
          <div
            key={file}
            className="flex items-center gap-2 px-2 py-1.5 rounded bg-[--af-bg-surface]/[0.02] border border-white/[0.05]"
          >
            <FolderOpen className="w-3 h-3 text-pink-400/60" />
            <span className="text-[10px] text-[--af-text-muted]">{file}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Sparkles,
    tag: "AI",
    tagColor: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    iconColor: "text-yellow-400",
    title: "AI Insights",
    description: "Predictive analytics for deadlines and budgets.",
    preview: (
      <div className="mt-4 p-3 rounded-lg bg-yellow-400/[0.04] border border-yellow-400/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-yellow-400" />
          <span className="text-[10px] text-yellow-400/80">
            Phase 3 likely delayed by 5 days
          </span>
        </div>
      </div>
    ),
  },
]

export function FeatureCards() {
  return (
    <section id="features" className="py-24 px-4 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <ScrollAnimation className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--af-text-muted] mb-4">
            Features
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Everything you need to{" "}
            <span className="text-[--af-text-muted]">ship projects</span>
          </h2>
          <p className="mt-4 text-[--af-text-muted] max-w-xl mx-auto">
            Purpose-built tools for architecture firms. No more spreadsheets,
            no more missed deadlines.
          </p>
        </ScrollAnimation>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <SpotlightCard className="p-6 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                  <span
                    className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full border ${feature.tagColor}`}
                  >
                    {feature.tag}
                  </span>
                </div>
                <h3 className="text-lg font-display font-bold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm text-[--af-text-muted] mt-1">
                  {feature.description}
                </p>
                {feature.preview}
              </SpotlightCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
