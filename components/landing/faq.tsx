"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { ScrollAnimation } from "./scroll-animation"
import { cn } from "@/lib/utils"

const faqs = [
  {
    question: "How is ArchaFlow different from generic project management tools?",
    answer:
      "ArchaFlow is purpose-built for architecture firms. We understand design phases, AIA billing, submittals, RFIs, and the unique workflows that architecture teams use every day. You won't waste time configuring a generic tool — it works out of the box for how you already work.",
  },
  {
    question: "Can I import data from tools we already use?",
    answer:
      "Yes. ArchaFlow integrates with Revit, AutoCAD, SketchUp, BIM 360, Procore, and 50+ other tools. You can also import project data via CSV or use our API for custom integrations.",
  },
  {
    question: "How long does it take to get set up?",
    answer:
      "Most firms are up and running within a day. Create your workspace, invite your team, and start adding projects. Our onboarding team offers free setup assistance for Pro and Teams plans.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. ArchaFlow uses bank-grade encryption (AES-256), SOC 2 Type II compliance, and your data is hosted on enterprise-grade infrastructure. Teams plans include SSO/SAML and advanced permission controls.",
  },
  {
    question: "Can I try ArchaFlow before committing?",
    answer:
      "Yes! Our Free plan lets you manage up to 3 projects with 5 team members — no credit card required. When you're ready, upgrade to Pro or Teams for unlimited projects and advanced features.",
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24 px-4 scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <ScrollAnimation className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--af-text-muted] mb-4">
            FAQ
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Common{" "}
            <span className="text-[--af-text-muted]">questions</span>
          </h2>
        </ScrollAnimation>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <ScrollAnimation key={i} delay={i * 0.05}>
              <div className="border border-white/[0.08] rounded-xl overflow-hidden hover:border-white/[0.12] transition-colors">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="text-sm font-medium text-white pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-[--af-text-muted] flex-shrink-0 transition-transform duration-200",
                      openIndex === i && "rotate-180"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-200",
                    openIndex === i ? "max-h-96" : "max-h-0"
                  )}
                >
                  <p className="px-6 pb-4 text-sm text-[--af-text-muted] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  )
}
