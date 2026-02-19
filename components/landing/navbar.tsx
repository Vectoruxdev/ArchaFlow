"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ArrowRight, Menu, X } from "lucide-react"

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#workflow" },
  { label: "FAQ", href: "#faq" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300",
        "rounded-full border border-white/[0.08] px-2 py-2",
        scrolled
          ? "bg-black/80 backdrop-blur-xl shadow-2xl shadow-black/20"
          : "bg-white/[0.03] backdrop-blur-md"
      )}
    >
      <div className="flex items-center gap-1">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 px-3 py-1.5">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
            <div className="w-3.5 h-3.5 border-2 border-black rotate-45" />
          </div>
          <span className="font-semibold text-white text-sm">ArchaFlow</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-0.5 ml-2">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3.5 py-1.5 text-sm text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.05]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <Link
          href="/login"
          className="hidden md:flex items-center px-3.5 py-1.5 ml-2 text-sm text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.05]"
        >
          Log In
        </Link>
        <Link
          href="/signup"
          className="hidden md:flex items-center gap-1.5 px-4 py-1.5 bg-white text-black text-sm font-medium rounded-full hover:bg-gray-200 transition-colors"
        >
          Start Free
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-white ml-2"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 mt-2 p-4 bg-black/95 backdrop-blur-xl rounded-2xl border border-white/[0.08]">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05] mt-2"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-black text-sm font-medium rounded-full hover:bg-gray-200 transition-colors"
            >
              Start Free
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
