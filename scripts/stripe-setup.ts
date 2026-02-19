/**
 * One-time Stripe setup script.
 * Creates products, prices, and coupons in your Stripe account.
 * Run with: npx tsx scripts/stripe-setup.ts
 *
 * Requires STRIPE_SECRET_KEY in your environment or .env.local file.
 */

import Stripe from "stripe"
import { readFileSync } from "fs"
import { resolve } from "path"

// Load .env.local manually (no dotenv dependency needed)
const envPath = resolve(process.cwd(), ".env.local")
try {
  const envContent = readFileSync(envPath, "utf-8")
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIndex = trimmed.indexOf("=")
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex)
    const value = trimmed.slice(eqIndex + 1)
    if (!process.env[key]) process.env[key] = value
  }
} catch {}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_SECRET_KEY) {
  console.error("ERROR: STRIPE_SECRET_KEY not found in environment or .env.local")
  process.exit(1)
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2026-01-28.clover",
})

async function main() {
  console.log("Setting up Stripe products, prices, and coupons...\n")

  // --- Pro Plan ---
  const proProduct = await stripe.products.create({
    name: "ArchaFlow Pro",
    description: "Professional plan for growing architecture firms. Includes 3 seats.",
  })
  console.log(`Created product: ${proProduct.name} (${proProduct.id})`)

  const proBasePrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 2900, // $29.00
    currency: "usd",
    recurring: { interval: "month" },
    nickname: "Pro Base - $29/mo",
  })
  console.log(`  Base price: $29/mo (${proBasePrice.id})`)

  const proSeatPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 1200, // $12.00
    currency: "usd",
    recurring: { interval: "month", usage_type: "licensed" },
    nickname: "Pro Extra Seat - $12/mo per seat",
  })
  console.log(`  Seat price: $12/mo per seat (${proSeatPrice.id})`)

  // --- Enterprise Plan ---
  const enterpriseProduct = await stripe.products.create({
    name: "ArchaFlow Enterprise",
    description: "Enterprise plan for large firms. Includes 10 seats.",
  })
  console.log(`\nCreated product: ${enterpriseProduct.name} (${enterpriseProduct.id})`)

  const enterpriseBasePrice = await stripe.prices.create({
    product: enterpriseProduct.id,
    unit_amount: 7900, // $79.00
    currency: "usd",
    recurring: { interval: "month" },
    nickname: "Enterprise Base - $79/mo",
  })
  console.log(`  Base price: $79/mo (${enterpriseBasePrice.id})`)

  const enterpriseSeatPrice = await stripe.prices.create({
    product: enterpriseProduct.id,
    unit_amount: 1000, // $10.00
    currency: "usd",
    recurring: { interval: "month", usage_type: "licensed" },
    nickname: "Enterprise Extra Seat - $10/mo per seat",
  })
  console.log(`  Seat price: $10/mo per seat (${enterpriseSeatPrice.id})`)

  // --- Coupons ---
  const foundingCoupon = await stripe.coupons.create({
    name: "Founding 50 - 60% Off Year 1",
    percent_off: 60,
    duration: "repeating",
    duration_in_months: 12,
    max_redemptions: 50,
    id: "FOUNDING50",
  })
  console.log(`\nCreated coupon: ${foundingCoupon.name} (${foundingCoupon.id})`)

  const loyaltyCoupon = await stripe.coupons.create({
    name: "Loyalty 25% Off",
    percent_off: 25,
    duration: "forever",
    id: "LOYALTY25",
  })
  console.log(`Created coupon: ${loyaltyCoupon.name} (${loyaltyCoupon.id})`)

  // --- Output env vars ---
  console.log("\n" + "=".repeat(60))
  console.log("Add these to your .env.local:\n")
  console.log(`STRIPE_PRO_BASE_PRICE_ID=${proBasePrice.id}`)
  console.log(`STRIPE_PRO_SEAT_PRICE_ID=${proSeatPrice.id}`)
  console.log(`STRIPE_ENTERPRISE_BASE_PRICE_ID=${enterpriseBasePrice.id}`)
  console.log(`STRIPE_ENTERPRISE_SEAT_PRICE_ID=${enterpriseSeatPrice.id}`)
  console.log(`STRIPE_FOUNDING_COUPON_ID=${foundingCoupon.id}`)
  console.log("=".repeat(60))
}

main().catch((err) => {
  console.error("Setup failed:", err)
  process.exit(1)
})
