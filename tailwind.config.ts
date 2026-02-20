import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["var(--af-font-display)"],
        body: ["var(--af-font-body)"],
        mono: ["var(--af-font-mono)"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* ── ArchaFlow Brand ── */
        brand: {
          DEFAULT: "var(--af-brand)",
          light: "var(--af-brand-light)",
          border: "var(--af-brand-border)",
          text: "var(--af-brand-text)",
        },
        /* ── Status Colors ── */
        success: {
          DEFAULT: "var(--af-success-text)",
          bg: "var(--af-success-bg)",
          border: "var(--af-success-border)",
        },
        warning: {
          DEFAULT: "var(--af-warning-text)",
          bg: "var(--af-warning-bg)",
          border: "var(--af-warning-border)",
        },
        danger: {
          DEFAULT: "var(--af-danger-text)",
          bg: "var(--af-danger-bg)",
          border: "var(--af-danger-border)",
        },
        info: {
          DEFAULT: "var(--af-info-text)",
          bg: "var(--af-info-bg)",
          border: "var(--af-info-border)",
        },
        /* ── Warm Neutrals ── */
        warm: {
          50: "#F7F4EF",
          100: "#F2EEE8",
          150: "#EAE4DC",
          200: "#E4DDD2",
          300: "#D0C8BC",
          400: "#B0A89E",
          500: "#7A7268",
          600: "#5A5248",
          700: "#3A342C",
          800: "#2A241E",
          900: "#1C1916",
          950: "#111110",
        },
        /* ── Amber ── */
        amber: {
          100: "#F5EBD9",
          200: "#EDD5AE",
          300: "#E0B050",
          400: "#D4873E",
          500: "#C8902A",
          600: "#8B5E2A",
          700: "#6A4418",
          800: "#3E2508",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        /* ── Component-specific ── */
        button: "var(--af-radius-button)",
        "input-af": "var(--af-radius-input)",
        card: "var(--af-radius-card)",
        modal: "var(--af-radius-modal)",
        dropdown: "var(--af-radius-dropdown)",
        badge: "var(--af-radius-badge)",
        sidebar: "var(--af-radius-sidebar)",
      },
      boxShadow: {
        "af-card": "var(--af-shadow-card)",
        "af-card-hover": "var(--af-shadow-card-hover)",
        "af-dropdown": "var(--af-shadow-dropdown)",
        "af-modal": "var(--af-shadow-modal)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "af-drop": {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "af-fade": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "af-slideUp": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "af-scale": {
          from: { opacity: "0", transform: "scale(0.96) translateY(8px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "af-drop": "af-drop 120ms ease-out",
        "af-fade": "af-fade 200ms ease",
        "af-slideUp": "af-slideUp 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        "af-scale": "af-scale 200ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
