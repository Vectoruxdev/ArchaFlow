"use client"

import { useState, useRef, useEffect } from "react"
import { Heading, Text } from "@/components/design-system"
import { Moon, Sun, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

import ColorsSection from "./_sections/ColorsSection"
import TypographySection from "./_sections/TypographySection"
import SpacingSection from "./_sections/SpacingSection"
import MotionSection from "./_sections/MotionSection"
import ComponentsSection from "./_sections/ComponentsSection"
import TokensSection from "./_sections/TokensSection"

const sections = [
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "spacing", label: "Spacing" },
  { id: "motion", label: "Motion" },
  { id: "components", label: "Components" },
  { id: "tokens", label: "Tokens" },
] as const

export default function DesignSystemPage() {
  const [activeSection, setActiveSection] = useState<string>("colors")
  const [darkPreview, setDarkPreview] = useState(false)
  const [mounted, setMounted] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const originalDarkRef = useRef(false)

  // Sync initial state after mount (avoids hydration mismatch)
  useEffect(() => {
    originalDarkRef.current = document.documentElement.classList.contains("dark")
    setDarkPreview(originalDarkRef.current)
    setMounted(true)
  }, [])

  // Toggle dark class on <html> so all CSS variables respond
  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    if (darkPreview) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    return () => {
      // Restore original theme on unmount
      const pref = localStorage.getItem("archaflow-theme") || "system"
      const shouldBeDark =
        pref === "dark" ||
        (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
      if (shouldBeDark) root.classList.add("dark")
      else root.classList.remove("dark")
    }
  }, [darkPreview, mounted])

  // TODO: Re-enable auth gate for production
  // const { currentWorkspace } = useAuth()
  // const isAdmin = currentWorkspace?.role
  //   ? ["owner", "admin"].includes(currentWorkspace.role)
  //   : false
  const isAdmin = true

  // Scroll spy
  useEffect(() => {
    const container = contentRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { root: container, rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    )

    sections.forEach(({ id }) => {
      const el = container.querySelector(`#${id}`)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldAlert className="w-12 h-12 text-[--af-text-muted]" />
        <Heading size="md">Access Denied</Heading>
        <Text color="muted">
          The design system is only available to workspace owners and admins.
        </Text>
      </div>
    )
  }

  return (
    <div className="flex h-screen transition-colors duration-300 bg-[--af-bg-canvas]">
      {/* Sidebar nav */}
      <nav className="w-52 shrink-0 border-r border-[--af-border-default] bg-[--af-bg-surface] p-4 hidden md:flex flex-col gap-1">
        <Text size="xs" color="muted" weight="semibold" className="uppercase tracking-widest mb-3 font-mono">
          Design System
        </Text>
        {sections.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => {
              const el = contentRef.current?.querySelector(`#${id}`)
              el?.scrollIntoView({ behavior: "smooth", block: "start" })
            }}
            className={`text-left px-3 py-1.5 rounded-sidebar text-[13px] transition-colors ${
              activeSection === id
                ? "bg-[--af-sidebar-active-bg] text-[--af-brand-text] font-semibold"
                : "text-[--af-text-secondary] hover:text-[--af-text-primary] hover:bg-[--af-bg-surface-alt]"
            }`}
          >
            {label}
          </button>
        ))}

        <div className="mt-auto pt-4 border-t border-[--af-border-default]">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => setDarkPreview((d) => !d)}
          >
            {mounted ? (
              darkPreview ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            {mounted ? (darkPreview ? "Light Preview" : "Dark Preview") : "Toggle Theme"}
          </Button>
        </div>
      </nav>

      {/* Main content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto af-scroll p-6 lg:p-10 space-y-16"
      >
        <div>
          <Heading as="h1" size="2xl">
            ArchaFlow Design System
          </Heading>
          <Text color="muted" size="lg" className="mt-2">
            Living style guide — tokens, primitives, and component library.
          </Text>
        </div>

        <ColorsSection />
        <TypographySection />
        <SpacingSection />
        <MotionSection />
        <ComponentsSection />
        <TokensSection />
      </div>
    </div>
  )
}
