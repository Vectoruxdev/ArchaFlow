"use client"

import { Check, ArrowRight } from "lucide-react"
import Link from "next/link"
import { ScrollAnimation, StaggerContainer, StaggerItem } from "./scroll-animation"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for small firms getting started.",
    highlighted: false,
    badge: null,
    href: "/signup",
    features: [
      "Up to 3 projects",
      "5 team members",
      "Basic task management",
      "Document storage (1 GB)",
      "Email support",
    ],
    cta: "Get Started",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month per user",
    description: "For growing firms that need more power.",
    highlighted: true,
    badge: "Most Popular",
    href: "/signup",
    features: [
      "Unlimited projects",
      "Unlimited team members",
      "AI-powered insights",
      "Advanced analytics & reports",
      "Budget tracking & alerts",
      "Custom workflows",
      "Document storage (100 GB)",
      "Priority support",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Teams",
    price: "$59",
    period: "/month per user",
    description: "For large firms with advanced needs.",
    highlighted: false,
    badge: null,
    href: "#pricing",
    features: [
      "Everything in Pro",
      "SSO / SAML authentication",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
      "Advanced permissions",
      "Unlimited storage",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-4 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <ScrollAnimation className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 mb-4">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Simple, transparent{" "}
            <span className="text-gray-500">pricing</span>
          </h2>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto">
            Start free. Upgrade when you need more. No hidden fees.
          </p>
        </ScrollAnimation>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <div
                className={`relative rounded-2xl border p-8 transition-colors ${
                  plan.highlighted
                    ? "bg-white text-black border-white shadow-2xl shadow-white/10"
                    : "bg-white/[0.03] text-white border-white/[0.08] hover:border-white/[0.15]"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-black text-white text-xs font-medium rounded-full border border-white/20">
                    {plan.badge}
                  </div>
                )}

                <h3
                  className={`text-lg font-semibold ${
                    plan.highlighted ? "text-black" : "text-white"
                  }`}
                >
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span
                    className={`text-sm ${
                      plan.highlighted ? "text-gray-500" : "text-gray-500"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`text-sm mt-2 ${
                    plan.highlighted ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  {plan.description}
                </p>

                <Link
                  href={plan.href}
                  className={`group flex items-center justify-center gap-2 w-full py-2.5 rounded-full font-medium text-sm mt-6 transition-colors ${
                    plan.highlighted
                      ? "bg-black text-white hover:bg-gray-800"
                      : "bg-white/[0.08] text-white hover:bg-white/[0.12] border border-white/[0.1]"
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
                          plan.highlighted ? "text-black" : "text-gray-500"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          plan.highlighted ? "text-gray-700" : "text-gray-400"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
