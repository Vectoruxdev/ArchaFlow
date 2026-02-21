"use client"

import { Heading, Text } from "@/components/design-system"

const radiusTokens = [
  { name: "none", value: "0px" },
  { name: "xs", value: "3px" },
  { name: "sm", value: "4px" },
  { name: "md", value: "6px" },
  { name: "lg", value: "8px" },
  { name: "xl", value: "10px" },
  { name: "2xl", value: "12px" },
  { name: "card", value: "14px" },
  { name: "modal", value: "16px" },
  { name: "badge", value: "20px" },
  { name: "full", value: "9999px" },
]

const shadowTokens = [
  { name: "Card", cssClass: "shadow-af-card" },
  { name: "Card Hover", cssClass: "shadow-af-card-hover" },
  { name: "Dropdown", cssClass: "shadow-af-dropdown" },
  { name: "Modal", cssClass: "shadow-af-modal" },
]

export default function SpacingSection() {
  return (
    <section id="spacing">
      <Heading size="lg" className="mb-6">Spacing &amp; Shape</Heading>

      <div className="space-y-10">
        {/* Border Radius */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Border Radius
          </Text>
          <div className="flex flex-wrap gap-6 bg-[--af-bg-surface] rounded-card border border-[--af-border-default] p-6">
            {radiusTokens.map((r) => (
              <div key={r.name} className="flex flex-col items-center gap-2">
                <div
                  className="w-16 h-16 bg-[--af-brand-light] border-2 border-[--af-brand-default]"
                  style={{ borderRadius: r.value }}
                />
                <Text size="xs" color="muted" mono>{r.name}</Text>
                <Text size="xs" color="muted">{r.value}</Text>
              </div>
            ))}
          </div>
        </div>

        {/* Shadows */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Shadows
          </Text>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-6">
            {shadowTokens.map((s) => (
              <div key={s.name} className="flex flex-col items-center gap-3">
                <div
                  className={`w-24 h-24 bg-[--af-bg-surface] rounded-card border border-[--af-border-default] ${s.cssClass}`}
                />
                <Text size="xs" color="muted" mono>{s.name}</Text>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
