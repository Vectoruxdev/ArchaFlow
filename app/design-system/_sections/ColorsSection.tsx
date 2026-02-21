"use client"

import { Heading, Text } from "@/components/design-system"

const semanticGroups = [
  {
    title: "Backgrounds",
    tokens: [
      { name: "--af-bg-canvas", label: "Canvas" },
      { name: "--af-bg-outer", label: "Outer" },
      { name: "--af-bg-surface", label: "Surface" },
      { name: "--af-bg-surface-alt", label: "Surface Alt" },
      { name: "--af-bg-surface-hover", label: "Surface Hover" },
      { name: "--af-bg-input", label: "Input" },
      { name: "--af-bg-sidebar", label: "Sidebar" },
    ],
  },
  {
    title: "Text",
    tokens: [
      { name: "--af-text-primary", label: "Primary" },
      { name: "--af-text-secondary", label: "Secondary" },
      { name: "--af-text-muted", label: "Muted" },
      { name: "--af-text-disabled", label: "Disabled" },
      { name: "--af-text-inverse", label: "Inverse" },
      { name: "--af-text-link", label: "Link" },
      { name: "--af-text-brand", label: "Brand" },
    ],
  },
  {
    title: "Borders",
    tokens: [
      { name: "--af-border-default", label: "Default" },
      { name: "--af-border-strong", label: "Strong" },
      { name: "--af-border-focus", label: "Focus" },
      { name: "--af-border-brand", label: "Brand" },
    ],
  },
  {
    title: "Brand",
    tokens: [
      { name: "--af-brand-default", label: "Default" },
      { name: "--af-brand-light", label: "Light" },
      { name: "--af-brand-border", label: "Border" },
      { name: "--af-brand-text", label: "Text" },
    ],
  },
  {
    title: "Status",
    tokens: [
      { name: "--af-success-text", label: "Success" },
      { name: "--af-success-bg", label: "Success BG" },
      { name: "--af-warning-text", label: "Warning" },
      { name: "--af-warning-bg", label: "Warning BG" },
      { name: "--af-danger-text", label: "Danger" },
      { name: "--af-danger-bg", label: "Danger BG" },
      { name: "--af-info-text", label: "Info" },
      { name: "--af-info-bg", label: "Info BG" },
    ],
  },
  {
    title: "Interactive",
    tokens: [
      { name: "--af-interactive-primary", label: "Primary" },
      { name: "--af-interactive-primary-text", label: "Primary Text" },
      { name: "--af-interactive-primary-hover", label: "Primary Hover" },
      { name: "--af-interactive-secondary", label: "Secondary" },
      { name: "--af-interactive-destructive", label: "Destructive" },
    ],
  },
]

function Swatch({ name, label }: { name: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-14 h-14 rounded-lg border border-[--af-border-default] shadow-sm"
        style={{ backgroundColor: `var(${name})` }}
      />
      <Text size="xs" color="muted" mono className="text-center truncate max-w-[80px]">
        {label}
      </Text>
    </div>
  )
}

export default function ColorsSection() {
  return (
    <section id="colors">
      <Heading size="lg" className="mb-6">Colors</Heading>
      <div className="space-y-8">
        {semanticGroups.map((group) => (
          <div key={group.title}>
            <Text weight="semibold" color="primary" className="mb-3">
              {group.title}
            </Text>
            <div className="flex flex-wrap gap-4">
              {group.tokens.map((token) => (
                <Swatch key={token.name} name={token.name} label={token.label} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
