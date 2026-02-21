"use client"

import { Heading, Text } from "@/components/design-system"

const headingSizes = ["2xl", "xl", "lg", "md", "sm"] as const
const textSizes = ["lg", "md", "sm", "xs"] as const
const textColors = ["primary", "secondary", "muted", "success", "warning", "danger", "brand", "info"] as const

export default function TypographySection() {
  return (
    <section id="typography">
      <Heading size="lg" className="mb-6">Typography</Heading>

      <div className="space-y-10">
        {/* Heading specimens */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Headings
          </Text>
          <div className="space-y-4 bg-[--af-bg-surface] rounded-card border border-[--af-border-default] p-6">
            {headingSizes.map((size) => (
              <div key={size} className="flex items-baseline gap-4">
                <Text size="xs" color="muted" mono className="w-10 shrink-0">
                  {size}
                </Text>
                <Heading size={size}>
                  The quick brown fox
                </Heading>
              </div>
            ))}
          </div>
        </div>

        {/* Text specimens */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Body Text Sizes
          </Text>
          <div className="space-y-3 bg-[--af-bg-surface] rounded-card border border-[--af-border-default] p-6">
            {textSizes.map((size) => (
              <div key={size} className="flex items-baseline gap-4">
                <Text size="xs" color="muted" mono className="w-10 shrink-0">
                  {size}
                </Text>
                <Text size={size} color="primary">
                  The quick brown fox jumps over the lazy dog
                </Text>
              </div>
            ))}
          </div>
        </div>

        {/* Text colors */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Text Colors
          </Text>
          <div className="space-y-2 bg-[--af-bg-surface] rounded-card border border-[--af-border-default] p-6">
            {textColors.map((color) => (
              <div key={color} className="flex items-center gap-4">
                <Text size="xs" color="muted" mono className="w-20 shrink-0">
                  {color}
                </Text>
                <Text size="sm" color={color}>
                  The quick brown fox jumps over the lazy dog
                </Text>
              </div>
            ))}
          </div>
        </div>

        {/* Font families */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Font Families
          </Text>
          <div className="space-y-4 bg-[--af-bg-surface] rounded-card border border-[--af-border-default] p-6">
            <div>
              <Text size="xs" color="muted" mono className="mb-1">Display — Cormorant Garamond</Text>
              <p className="font-display text-xl text-[--af-text-primary]">
                Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
              </p>
            </div>
            <div>
              <Text size="xs" color="muted" mono className="mb-1">Body — Inter</Text>
              <p className="font-body text-sm text-[--af-text-primary]">
                Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0123456789
              </p>
            </div>
            <div>
              <Text size="xs" color="muted" mono className="mb-1">Mono — IBM Plex Mono</Text>
              <p className="font-mono text-sm text-[--af-text-primary]">
                Aa Bb Cc Dd Ee Ff Gg Hh 0123456789 {`{} [] () => // /* */`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
