/**
 * ArchaFlow Design System — Framer Motion Tokens
 *
 * Re-exports motion values from tokens.ts in Framer Motion-compatible formats.
 * CSS strings like "200ms" are converted to numeric seconds (0.2).
 */

import type { Transition, Variants } from "framer-motion"
import { motion as motionTokens } from "./tokens"

/* ─── Duration (seconds) ─── */
export const duration = {
  instant: 0,
  fastest: 0.08,
  fast: 0.12,
  normal: 0.2,
  slow: 0.3,
  slower: 0.45,
  slowest: 0.6,
  xslow: 0.9,
  page: 1.2,
} as const

/* ─── Easing (cubic-bezier arrays) ─── */
export const easing = {
  linear: [0, 0, 1, 1] as [number, number, number, number],
  easeIn: [0.4, 0, 1, 1] as [number, number, number, number],
  easeOut: [0, 0, 0.2, 1] as [number, number, number, number],
  easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  spring: [0.16, 1, 0.3, 1] as [number, number, number, number],
  bounce: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  anticipate: [0.36, 0, 0.66, -0.56] as [number, number, number, number],
} as const

/* ─── Default transition ─── */
export const defaultTransition: Transition = {
  duration: duration.normal,
  ease: easing.spring,
}

/* ─── Pre-built Variants ─── */

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.normal, ease: easing.easeOut } },
  exit: { opacity: 0, transition: { duration: duration.fast, ease: easing.easeIn } },
}

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.spring } },
  exit: { opacity: 0, y: -8, transition: { duration: duration.fast, ease: easing.easeIn } },
}

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -6 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.fast, ease: easing.easeOut } },
  exit: { opacity: 0, y: -6, transition: { duration: duration.fast, ease: easing.easeIn } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: duration.normal, ease: easing.spring } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: duration.fast, ease: easing.easeIn } },
}

/** Stagger container — wrap children with staggerItem */
export function staggerChildren(staggerDelay = 0.05): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: duration.fast,
      },
    },
  }
}

/** Child variant for stagger containers */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.spring } },
}

/* Re-export raw CSS motion tokens for non-Framer usage */
export { motionTokens }
