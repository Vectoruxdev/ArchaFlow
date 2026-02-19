"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { ScrollAnimation } from "./scroll-animation"

const sourceNodes = [
  "Revit",
  "AutoCAD",
  "SketchUp",
  "BIM 360",
  "Rhino",
  "Specs",
  "Budget Data",
]

const outputNodes = [
  "Timelines",
  "Reports",
  "Budgets",
  "Team Tasks",
  "Client Updates",
]

export function DataFlowViz() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })
  const [isHovering, setIsHovering] = useState(false)
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
    const handleEnter = () => setIsHovering(true)
    const handleLeave = () => setIsHovering(false)
    el.addEventListener("mouseenter", handleEnter)
    el.addEventListener("mouseleave", handleLeave)

    let prev = { x: 0.5, y: 0.5 }
    function tick() {
      prev = {
        x: prev.x + (targetRef.current.x - prev.x) * 0.06,
        y: prev.y + (targetRef.current.y - prev.y) * 0.06,
      }
      setMouse({ x: prev.x, y: prev.y })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      el.removeEventListener("mousemove", handleMouseMove)
      el.removeEventListener("mouseenter", handleEnter)
      el.removeEventListener("mouseleave", handleLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [handleMouseMove])

  const mx = (mouse.x - 0.5) * 2
  const my = (mouse.y - 0.5) * 2

  return (
    <section className="relative py-32 md:py-40 px-4 overflow-hidden">
      {/* Section heading */}
      <ScrollAnimation className="text-center mb-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 mb-4">
          Data Flow
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-white">
          Everything connects to{" "}
          <span className="text-gray-500">ArchaFlow</span>
        </h2>
      </ScrollAnimation>

      {/* Large interactive area */}
      <div
        ref={sectionRef}
        className="relative max-w-7xl mx-auto cursor-crosshair"
      >
        {/* Mouse-following glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${mouse.x * 100}% ${mouse.y * 100}%, rgba(255,255,255,0.03) 0%, transparent 60%)`,
          }}
        />

        {/* Legend */}
        <div className="flex items-center justify-center gap-8 mb-16">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Data In
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Insights Out
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr_1fr] gap-8 md:gap-6 items-center min-h-[350px] md:min-h-[500px]">
          {/* Source nodes */}
          <ScrollAnimation direction="left">
            <div className="flex flex-row flex-wrap md:flex-col gap-3 md:gap-4 justify-center md:justify-start md:items-end">
              {sourceNodes.map((node) => (
                <div
                  key={node}
                  className="group flex items-center gap-2 md:gap-3"
                >
                  <span className="text-sm md:text-base text-gray-400 group-hover:text-white transition-colors">
                    {node}
                  </span>
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-white/80 ring-4 ring-white/10 group-hover:ring-white/20 transition-all" />
                </div>
              ))}
            </div>
          </ScrollAnimation>

          {/* Central 3D cube — bigger */}
          <ScrollAnimation delay={0.2}>
            <div
              className="relative w-full aspect-square max-w-[300px] md:max-w-[420px] mx-auto"
              style={{ perspective: "1000px" }}
            >
              {/* Dot grid background */}
              <div
                className="absolute inset-0 opacity-15 rounded-3xl"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                  transform: `translate(${mx * -4}px, ${my * -4}px)`,
                }}
              />

              {/* Large subtle glow */}
              <div
                className="absolute inset-[-20%] rounded-full"
                style={{
                  background: `radial-gradient(circle at ${mouse.x * 100}% ${mouse.y * 100}%, rgba(255,255,255,0.06) 0%, transparent 50%)`,
                }}
              />

              {/* SVG flow lines — full container */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 420 420"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Input curves (left edge → center) */}
                {sourceNodes.map((_, i) => {
                  const yStart = 60 + i * 44
                  return (
                    <path
                      key={`in-${i}`}
                      d={`M 0 ${yStart} C 80 ${yStart} 130 210 180 210`}
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="1"
                      className="animate-dash-flow"
                      style={{
                        strokeDasharray: "4 10",
                        animationDelay: `${i * 0.4}s`,
                      }}
                    />
                  )
                })}
                {/* Output curves (center → right edge) */}
                {outputNodes.map((_, i) => {
                  const yEnd = 95 + i * 56
                  return (
                    <path
                      key={`out-${i}`}
                      d={`M 240 210 C 290 210 340 ${yEnd} 420 ${yEnd}`}
                      fill="none"
                      stroke="rgba(74,222,128,0.1)"
                      strokeWidth="1"
                      className="animate-dash-flow"
                      style={{
                        strokeDasharray: "4 10",
                        animationDelay: `${i * 0.4}s`,
                      }}
                    />
                  )
                })}
              </svg>

              {/* 3D Rotating diamond */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isHovering
                    ? `rotateX(${my * -15}deg) rotateY(${mx * 15}deg)`
                    : undefined,
                  animation: isHovering
                    ? "none"
                    : "spinCube 16s linear infinite",
                  transition: isHovering ? "transform 0.15s" : undefined,
                }}
              >
                <div
                  className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Front face */}
                  <div
                    className="absolute inset-0 border border-white/25 bg-white/[0.04]"
                    style={{ transform: "rotateZ(45deg) translateZ(30px)" }}
                  />
                  {/* Back face */}
                  <div
                    className="absolute inset-0 border border-white/10 bg-white/[0.02]"
                    style={{ transform: "rotateZ(45deg) translateZ(-30px)" }}
                  />
                  {/* Top */}
                  <div
                    className="absolute inset-0 border border-white/15 bg-white/[0.03]"
                    style={{
                      transform: "rotateZ(45deg) rotateX(90deg) translateZ(30px)",
                    }}
                  />
                  {/* Bottom */}
                  <div
                    className="absolute inset-0 border border-white/8 bg-white/[0.02]"
                    style={{
                      transform:
                        "rotateZ(45deg) rotateX(-90deg) translateZ(30px)",
                    }}
                  />
                </div>

                {/* Center logo */}
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ transform: "translateZ(35px)" }}
                >
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-xl flex items-center justify-center shadow-2xl shadow-white/10">
                    <div className="w-5 h-5 md:w-7 md:h-7 border-2 border-black rotate-45" />
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimation>

          {/* Output nodes */}
          <ScrollAnimation direction="right">
            <div className="flex flex-row flex-wrap md:flex-col gap-3 md:gap-4 justify-center md:justify-start md:items-start">
              {outputNodes.map((node) => (
                <div
                  key={node}
                  className="group flex items-center gap-2 md:gap-3"
                >
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-400/80 ring-4 ring-green-400/10 group-hover:ring-green-400/20 transition-all" />
                  <span className="text-sm md:text-base text-gray-400 group-hover:text-white transition-colors">
                    {node}
                  </span>
                </div>
              ))}
            </div>
          </ScrollAnimation>
        </div>
      </div>
    </section>
  )
}
