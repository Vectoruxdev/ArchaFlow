"use client"

import { useRef, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollAnimation } from "./scroll-animation"

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })
  const rafRef = useRef<number>(0)
  const targetRef = useRef({ x: 0.5, y: 0.5 })

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!sectionRef.current) return
    const rect = sectionRef.current.getBoundingClientRect()
    targetRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    }
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    el.addEventListener("mousemove", handleMouseMove, { passive: true })

    // Smooth lerp loop
    let prev = { x: 0.5, y: 0.5 }
    function tick() {
      prev = {
        x: prev.x + (targetRef.current.x - prev.x) * 0.08,
        y: prev.y + (targetRef.current.y - prev.y) * 0.08,
      }
      setMouse({ x: prev.x, y: prev.y })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      el.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [handleMouseMove])

  // Parallax offsets based on mouse (centered at 0)
  const mx = (mouse.x - 0.5) * 2 // -1 to 1
  const my = (mouse.y - 0.5) * 2

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-28 pb-20 overflow-hidden"
    >
      {/* === Abstract architectural background === */}

      {/* Large radial glow that follows mouse */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: `radial-gradient(800px circle at ${mouse.x * 100}% ${mouse.y * 100}%, rgba(255,255,255,0.04) 0%, transparent 60%)`,
        }}
      />

      {/* Grid pattern with parallax */}
      <div
        className="absolute inset-[-20%] opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          transform: `translate(${mx * -8}px, ${my * -8}px)`,
        }}
      />

      {/* Floating architectural line elements — thin rectangles */}
      {/* Horizontal beam - top left */}
      <div
        className="absolute top-[15%] left-[8%] w-48 md:w-72 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent"
        style={{ transform: `translate(${mx * -20}px, ${my * -12}px)` }}
      />
      {/* Vertical beam - right */}
      <div
        className="absolute top-[20%] right-[12%] w-px h-40 md:h-64 bg-gradient-to-b from-transparent via-white/[0.08] to-transparent"
        style={{ transform: `translate(${mx * 15}px, ${my * -18}px)` }}
      />
      {/* Angled line - bottom left */}
      <div
        className="absolute bottom-[22%] left-[5%] w-40 md:w-56 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
        style={{
          transform: `translate(${mx * -25}px, ${my * 20}px) rotate(-15deg)`,
        }}
      />
      {/* Rectangle outline - top right area */}
      <div
        className="absolute top-[12%] right-[6%] w-24 md:w-36 h-16 md:h-24 border border-white/[0.04] rounded-sm"
        style={{ transform: `translate(${mx * 20}px, ${my * -15}px)` }}
      />
      {/* Rectangle outline - bottom left */}
      <div
        className="absolute bottom-[18%] left-[10%] w-20 md:w-28 h-20 md:h-28 border border-white/[0.03] rounded-sm"
        style={{
          transform: `translate(${mx * -18}px, ${my * 22}px) rotate(12deg)`,
        }}
      />
      {/* Small diamond shape - mid left */}
      <div
        className="absolute top-[45%] left-[3%] w-10 md:w-14 h-10 md:h-14 border border-white/[0.05]"
        style={{
          transform: `translate(${mx * -30}px, ${my * 10}px) rotate(45deg)`,
        }}
      />
      {/* Cross hairs / intersection - right mid */}
      <div className="absolute top-[55%] right-[8%]" style={{ transform: `translate(${mx * 25}px, ${my * 15}px)` }}>
        <div className="w-12 md:w-16 h-px bg-[--af-bg-surface]/[0.06] absolute top-1/2 left-0" />
        <div className="w-px h-12 md:h-16 bg-[--af-bg-surface]/[0.06] absolute left-1/2 top-0" />
      </div>
      {/* Long horizontal beam - center bottom */}
      <div
        className="absolute bottom-[30%] left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
        style={{ transform: `translateX(-50%) translateY(${my * 12}px)` }}
      />
      {/* Arc / curved element - top */}
      <svg
        className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[500px] md:w-[700px] h-24 pointer-events-none"
        style={{ transform: `translateX(-50%) translate(${mx * -10}px, ${my * -14}px)` }}
        viewBox="0 0 700 100"
        fill="none"
      >
        <path
          d="M 0 80 Q 350 -20 700 80"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="1"
        />
      </svg>
      {/* Small circles / nodes */}
      <div
        className="absolute top-[25%] left-[20%] w-2 h-2 rounded-full bg-[--af-bg-surface]/[0.08]"
        style={{ transform: `translate(${mx * -22}px, ${my * -16}px)` }}
      />
      <div
        className="absolute top-[70%] right-[20%] w-1.5 h-1.5 rounded-full bg-[--af-bg-surface]/[0.06]"
        style={{ transform: `translate(${mx * 18}px, ${my * 20}px)` }}
      />
      <div
        className="absolute top-[35%] right-[25%] w-1 h-1 rounded-full bg-[--af-bg-surface]/[0.1]"
        style={{ transform: `translate(${mx * 12}px, ${my * -10}px)` }}
      />

      {/* === Content === */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <ScrollAnimation delay={0}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.1] bg-[--af-bg-surface]/[0.03] mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-signal-pulse absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[--af-success-bg]0" />
            </span>
            <span className="text-sm text-[--af-text-muted]">
              Now in Beta — AI-powered project insights
            </span>
          </div>
        </ScrollAnimation>

        {/* Headline — mouse-reactive spotlight on text */}
        <ScrollAnimation delay={0.1}>
          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] hero-heading"
            style={{
              backgroundImage: `radial-gradient(600px circle at ${mouse.x * 100}% ${mouse.y * 100}%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 30%, rgba(120,120,120,0.5) 80%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Manage projects.
            <br />
            Deliver on time.
          </h1>
        </ScrollAnimation>

        {/* Subheadline */}
        <ScrollAnimation delay={0.2}>
          <p className="mt-6 text-lg md:text-xl text-[--af-text-muted] max-w-2xl mx-auto leading-relaxed">
            ArchaFlow gives architecture firms a single platform to plan projects,
            track budgets, assign tasks, and collaborate — from concept to
            completion.
          </p>
        </ScrollAnimation>

        {/* CTAs */}
        <ScrollAnimation delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Link
              href="/signup"
              className="group flex items-center gap-2 px-7 py-3 bg-[--af-bg-surface] text-foreground font-medium rounded-full hover:bg-[--af-bg-surface-alt] transition-all text-base"
            >
              Start Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </ScrollAnimation>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-5 h-8 rounded-full border-2 border-white/20 flex justify-center pt-1.5">
          <div className="w-1 h-2 bg-[--af-bg-surface]/40 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  )
}
