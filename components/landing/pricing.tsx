"use client"

import { Check, ArrowRight } from "lucide-react"
import Link from "next/link"
import { ScrollAnimation, StaggerContainer, StaggerItem } from "./scroll-animation"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for solo architects getting started.",
    highlighted: false,
    badge: null,
    href: "/signup",
    features: [
      "1 user",
      "Up to 50 projects",
      "Basic task management",
      "Document storage (1 GB)",
      "Core workflow tools",
      "Email support",
    ],
    cta: "Get Started Free",
    extraNote: null,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month base",
    description: "For growing firms that need more power.",
    highlighted: true,
    badge: "Most Popular",
    href: "/signup?plan=pro",
    features: [
      "3 users included",
      "+$12/user/mo for extra seats",
      "Unlimited projects",
      "AI-powered insights (500 credits/mo)",
      "Advanced analytics & reports",
      "Budget tracking & alerts",
      "Custom workflows",
      "Document storage (100 GB)",
      "Priority support",
    ],
    cta: "Start Pro",
    extraNote: "Extra AI credits: $15 per 1,000",
  },
  {
    name: "Enterprise",
    price: "$79",
    period: "/month base",
    description: "For large firms with advanced needs.",
    highlighted: false,
    badge: null,
    href: "/signup?plan=enterprise",
    features: [
      "10 users included",
      "+$10/user/mo for extra seats",
      "Everything in Pro",
      "AI-powered insights (2,000 credits/mo)",
      "SSO / SAML authentication",
      "API access",
      "Custom integrations",
      "Unlimited storage",
      "Dedicated account manager",
    ],
    cta: "Start Enterprise",
    extraNote: "Extra AI credits: $12 per 1,000",
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-4 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <ScrollAnimation className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--af-text-muted] mb-4">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Simple, transparent{" "}
            <span className="text-[--af-text-muted]">pricing</span>
          </h2>
          <p className="mt-4 text-[--af-text-muted] max-w-xl mx-auto">
            Start free. Upgrade when you need more. No hidden fees.
          </p>
        </ScrollAnimation>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <div
                className={`relative rounded-2xl border p-8 transition-colors ${
                  plan.highlighted
                    ? "bg-[--af-bg-surface] text-foreground border-white shadow-2xl shadow-white/10"
                    : "bg-[--af-bg-surface]/[0.03] text-white border-white/[0.08] hover:border-white/[0.15]"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-warm-900 text-white text-xs font-medium rounded-full border border-white/20">
                    {plan.badge}
                  </div>
                )}

                <h3
                  className={`text-lg font-display font-bold ${
                    plan.highlighted ? "text-foreground" : "text-white"
                  }`}
                >
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span
                    className={`text-sm ${
                      plan.highlighted ? "text-[--af-text-muted]" : "text-[--af-text-muted]"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`text-sm mt-2 ${
                    plan.highlighted ? "text-[--af-text-secondary]" : "text-[--af-text-muted]"
                  }`}
                >
                  {plan.description}
                </p>

                <Link
                  href={plan.href}
                  className={`group flex items-center justify-center gap-2 w-full py-2.5 rounded-full font-medium text-sm mt-6 transition-colors ${
                    plan.highlighted
                      ? "bg-warm-900 text-white hover:bg-warm-800"
                      : "bg-[--af-bg-surface]/[0.08] text-white hover:bg-[--af-bg-surface]/[0.12] border border-white/[0.1]"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5">
                      <Check
                        className={`w-4 h-4 flex-shrink-0 ${
                          plan.highlighted ? "text-foreground" : "text-[--af-text-muted]"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          plan.highlighted ? "text-[--af-text-secondary]" : "text-[--af-text-muted]"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.extraNote && (
                  <p
                    className={`text-xs mt-4 pt-4 border-t ${
                      plan.highlighted
                        ? "text-[--af-text-muted] border-[--af-border-default]"
                        : "text-[--af-text-muted] border-white/[0.08]"
                    }`}
                  >
                    {plan.extraNote}
                  </p>
                )}
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
