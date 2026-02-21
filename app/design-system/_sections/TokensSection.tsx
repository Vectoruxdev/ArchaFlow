"use client"

import { Heading, Text } from "@/components/design-system"

const spacingScale = [
  { name: "0.5", px: 2 },
  { name: "1", px: 4 },
  { name: "1.5", px: 6 },
  { name: "2", px: 8 },
  { name: "2.5", px: 10 },
  { name: "3", px: 12 },
  { name: "4", px: 16 },
  { name: "5", px: 20 },
  { name: "6", px: 24 },
  { name: "8", px: 32 },
  { name: "10", px: 40 },
  { name: "12", px: 48 },
  { name: "16", px: 64 },
  { name: "20", px: 80 },
]

const namedSpacing = [
  { name: "xs", px: 4 },
  { name: "sm", px: 8 },
  { name: "md", px: 12 },
  { name: "lg", px: 16 },
  { name: "xl", px: 24 },
  { name: "2xl", px: 32 },
  { name: "3xl", px: 48 },
  { name: "4xl", px: 64 },
]

const componentSpacing = [
  { name: "inputPaddingX", px: 12 },
  { name: "inputPaddingY", px: 8 },
  { name: "buttonPaddingX", px: 16 },
  { name: "cardPadding", px: 20 },
  { name: "pageGutter", px: 28 },
  { name: "sidebarWidth", px: 210 },
]

export default function TokensSection() {
  return (
    <section id="tokens">
      <Heading size="lg" className="mb-6">Tokens</Heading>

      <div className="space-y-10">
        {/* Spacing scale */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Spacing Scale
          </Text>
          <div className="bg-[--af-bg-surface] rounded-card border border-[--af-border-default] p-6 space-y-2">
            {spacingScale.map((s) => (
              <div key={s.name} className="flex items-center gap-4">
                <Text size="xs" color="muted" mono className="w-8 text-right shrink-0">
                  {s.name}
                </Text>
                <div
                  className="h-3 bg-[--af-brand-default] rounded-sm"
                  style={{ width: `${s.px}px` }}
                />
                <Text size="xs" color="muted" className="shrink-0">
                  {s.px}px
                </Text>
              </div>
            ))}
          </div>
        </div>

        {/* Named spacing */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Named Spacing
          </Text>
          <div className="bg-[--af-bg-surface] rounded-card border border-[--af-border-default] p-6 space-y-2">
            {namedSpacing.map((s) => (
              <div key={s.name} className="flex items-center gap-4">
                <Text size="xs" color="muted" mono className="w-10 text-right shrink-0">
                  {s.name}
                </Text>
                <div
                  className="h-3 bg-[--af-info-text] rounded-sm opacity-60"
                  style={{ width: `${s.px}px` }}
                />
                <Text size="xs" color="muted" className="shrink-0">
                  {s.px}px
                </Text>
              </div>
            ))}
          </div>
        </div>

        {/* Component spacing */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Component Spacing
          </Text>
          <div className="bg-[--af-bg-surface] rounded-card border border-[--af-border-default] p-6 space-y-2">
            {componentSpacing.map((s) => (
              <div key={s.name} className="flex items-center gap-4">
                <Text size="xs" color="muted" mono className="w-32 text-right shrink-0">
                  {s.name}
                </Text>
                <div
                  className="h-3 bg-[--af-success-text] rounded-sm opacity-50"
                  style={{ width: `${Math.min(s.px, 210)}px` }}
                />
                <Text size="xs" color="muted" className="shrink-0">
                  {s.px}px
                </Text>
              </div>
            ))}
          </div>
        </div>

        {/* Border radius visualization */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Component Radius Tokens
          </Text>
          <div className="bg-[--af-bg-surface] rounded-card border border-[--af-border-default] p-6">
            <div className="flex flex-wrap gap-6">
              {[
                { name: "button", value: "9px" },
                { name: "input", value: "9px" },
                { name: "card", value: "14px" },
                { name: "modal", value: "16px" },
                { name: "dropdown", value: "10px" },
                { name: "badge", value: "20px" },
                { name: "toast", value: "10px" },
                { name: "sidebar", value: "8px" },
                { name: "tab", value: "7px" },
              ].map((r) => (
                <div key={r.name} className="flex flex-col items-center gap-2">
                  <div
                    className="w-16 h-10 border-2 border-[--af-brand-default] bg-[--af-brand-light]"
                    style={{ borderRadius: r.value }}
                  />
                  <Text size="xs" color="muted" mono>{r.name}</Text>
                  <Text size="xs" color="muted">{r.value}</Text>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
