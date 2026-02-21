"use client"

import { useState, useRef, useEffect } from "react"
import { Heading, Text } from "@/components/design-system"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

import ColorsSection from "@/app/design-system/_sections/ColorsSection"
import TypographySection from "@/app/design-system/_sections/TypographySection"
import SpacingSection from "@/app/design-system/_sections/SpacingSection"
import MotionSection from "@/app/design-system/_sections/MotionSection"
import ComponentsSection from "@/app/design-system/_sections/ComponentsSection"
import TokensSection from "@/app/design-system/_sections/TokensSection"

const sections = [
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "spacing", label: "Spacing" },
  { id: "motion", label: "Motion" },
  { id: "components", label: "Components" },
  { id: "tokens", label: "Tokens" },
] as const

export default function AdminDesignSystemPage() {
  const [darkPreview, setDarkPreview] = useState(false)
  const [mounted, setMounted] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDarkPreview(document.documentElement.classList.contains("dark"))
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    if (darkPreview) root.classList.add("dark")
    else root.classList.remove("dark")
    return () => {
      const pref = localStorage.getItem("archaflow-theme") || "system"
      const shouldBeDark =
        pref === "dark" ||
        (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
      if (shouldBeDark) root.classList.add("dark")
      else root.classList.remove("dark")
    }
  }, [darkPreview, mounted])

  return (
    <div ref={contentRef} className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <Heading as="h1" size="2xl">Design System</Heading>
          <Text color="muted" size="lg" className="mt-2">
            Living style guide — tokens, primitives, and component library.
          </Text>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setDarkPreview((d) => !d)}
        >
          {mounted ? (
            darkPreview ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
          {mounted ? (darkPreview ? "Light" : "Dark") : "Toggle"}
        </Button>
      </div>

      {/* Quick jump links */}
      <div className="flex flex-wrap gap-2">
        {sections.map(({ id, label }) => (
          <Button
            key={id}
            variant="ghost"
            size="sm"
            onClick={() => contentRef.current?.querySelector(`#${id}`)?.scrollIntoView({ behavior: "smooth" })}
          >
            {label}
          </Button>
        ))}
      </div>

      <ColorsSection />
      <TypographySection />
      <SpacingSection />
      <MotionSection />
      <ComponentsSection />
      <TokensSection />
    </div>
  )
}
