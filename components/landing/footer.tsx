"use client"

import Link from "next/link"

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
}

const newFeatures = [
  "AI-Powered Insights",
  "Budget Tracking",
  "Smart Workflows",
  "Team Workload",
  "Document Management",
  "Project Dashboard",
]

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Logo + Tagline */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-[--af-bg-surface] rounded-lg flex items-center justify-center">
                <div className="w-3.5 h-3.5 border-2 border-foreground rotate-45" />
              </div>
              <span className="font-semibold text-white text-sm">
                ArchaFlow
              </span>
            </Link>
            <p className="text-sm text-[--af-text-muted] max-w-xs">
              Project management built for architecture firms. From concept to
              completion.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[--af-text-muted] mb-4">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[--af-text-muted] hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* New Features */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[--af-text-muted] mb-4">
              New Features
            </h4>
            <ul className="space-y-2.5">
              {newFeatures.map((feature) => (
                <li key={feature}>
                  <span className="text-sm text-[--af-text-muted]">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-16 pt-8 border-t border-white/[0.06] gap-4">
          <p className="text-xs text-[--af-text-secondary]">
            &copy; {new Date().getFullYear()} ArchaFlow. All rights reserved.
            <span className="ml-2 text-[--af-text-secondary]">v0.1.1</span>
          </p>
          <div className="flex items-center gap-4">
            {/* Social icons as simple text links */}
            {["Twitter", "LinkedIn", "GitHub"].map((social) => (
              <a
                key={social}
                href="#"
                className="text-xs text-[--af-text-secondary] hover:text-[--af-text-muted] transition-colors"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
