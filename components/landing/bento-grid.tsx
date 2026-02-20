"use client"

import { SpotlightCard } from "./spotlight-card"
import { ScrollAnimation, StaggerContainer, StaggerItem } from "./scroll-animation"
import { Sparkles, Building2, ArrowRight } from "lucide-react"

const integrationTags = [
  "Revit",
  "AutoCAD",
  "SketchUp",
  "BIM 360",
  "Rhino",
  "Bluebeam",
  "Procore",
  "Slack",
  "Google Drive",
  "Dropbox",
]

export function BentoGrid() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <ScrollAnimation className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--af-text-muted] mb-4">
            Platform
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Built different.{" "}
            <span className="text-[--af-text-muted]">Built for you.</span>
          </h2>
        </ScrollAnimation>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Integration card — 2 cols */}
          <StaggerItem className="md:col-span-2">
            <SpotlightCard className="p-8 h-full">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[--af-text-muted] mb-2">
                Integrations
              </p>
              <h3 className="text-2xl font-display font-bold tracking-tight text-white mb-2">
                50+ Integrations. Zero Data Silos.
              </h3>
              <p className="text-sm text-[--af-text-muted] mb-6">
                Connect the tools your team already uses. Data flows in
                automatically.
              </p>
              <div className="flex flex-wrap gap-2">
                {integrationTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-[--af-bg-surface]/[0.04] border border-white/[0.08] text-xs text-[--af-text-muted] hover:border-white/20 hover:text-white transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </SpotlightCard>
          </StaggerItem>

          {/* AI forecasting — 1 col */}
          <StaggerItem>
            <SpotlightCard className="p-8 h-full" spotlightColor="rgba(250,204,21,0.04)">
              <Sparkles className="w-6 h-6 text-yellow-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                AI-Powered Forecasting
              </h3>
              <p className="text-sm text-[--af-text-muted] mb-6">
                Predict delays, budget overruns, and resource gaps before they
                happen.
              </p>
              {/* Mini progress bars */}
              <div className="space-y-3">
                {[
                  { label: "Timeline Risk", pct: 23, color: "bg-green-400" },
                  { label: "Budget Risk", pct: 68, color: "bg-yellow-400" },
                  { label: "Resource Load", pct: 45, color: "bg-blue-400" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[--af-text-muted]">{item.label}</span>
                      <span className="text-[--af-text-muted]">{item.pct}%</span>
                    </div>
                    <div className="h-1 bg-[--af-bg-surface]/[0.05] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </StaggerItem>

          {/* Architecture — 1 col */}
          <StaggerItem>
            <SpotlightCard className="p-8 h-full">
              <Building2 className="w-6 h-6 text-white/60 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                Built for Architecture
              </h3>
              <p className="text-sm text-[--af-text-muted]">
                Not another generic PM tool. ArchaFlow speaks your language —
                phases, submittals, RFIs, shop drawings, and AIA billing built
                in from day one.
              </p>
            </SpotlightCard>
          </StaggerItem>

          {/* Automation — 2 cols */}
          <StaggerItem className="md:col-span-2">
            <SpotlightCard className="p-8 h-full">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[--af-text-muted] mb-2">
                Automation
              </p>
              <h3 className="text-2xl font-display font-bold tracking-tight text-white mb-2">
                Your rules. Automated execution.
              </h3>
              <p className="text-sm text-[--af-text-muted] mb-6">
                Define triggers and let ArchaFlow handle the rest. No code
                required.
              </p>
              {/* Flow diagram */}
              <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-2">
                {[
                  { label: "Task Created", sub: "Trigger" },
                  { label: "Auto-Assign", sub: "Action" },
                  { label: "Notify Team", sub: "Action" },
                  { label: "Update Status", sub: "Action" },
                ].map((item, i) => (
                  <div key={item.label} className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <div className="px-3 sm:px-4 py-2 rounded-lg bg-[--af-bg-surface]/[0.04] border border-white/[0.08]">
                      <div className="text-xs sm:text-sm text-white font-medium whitespace-nowrap">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-[--af-text-muted]">{item.sub}</div>
                    </div>
                    {i < 3 && (
                      <ArrowRight className="w-3.5 h-3.5 text-[--af-text-secondary] flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </section>
  )
}
