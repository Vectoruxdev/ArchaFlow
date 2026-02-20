import Link from "next/link"
import { Mail } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact - ArchaFlow",
  description: "Get in touch with the ArchaFlow team",
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[--af-bg-canvas] dark:bg-warm-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-warm-900 dark:bg-[--af-bg-surface] rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white dark:border-foreground rotate-45" />
            </div>
            <span className="font-semibold text-2xl">ArchaFlow</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-[--af-text-secondary] hover:text-foreground dark:hover:text-white"
          >
            &larr; Back to Home
          </Link>
        </div>

        {/* Content */}
        <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Contact Us</h1>
          <p className="text-[--af-text-muted] mb-8">
            Have a question, feedback, or interested in ArchaFlow? We&apos;d love
            to hear from you.
          </p>

          <div className="flex items-center gap-4 p-6 rounded-lg bg-[--af-bg-surface-alt] border border-[--af-border-default] mb-8">
            <div className="w-12 h-12 rounded-full bg-warm-900 dark:bg-[--af-bg-surface] flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-white dark:text-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Email Us</p>
              <a
                href="mailto:jared@archaflow.com"
                className="text-[--af-text-secondary] hover:text-foreground dark:hover:text-white transition-colors"
              >
                jared@archaflow.com
              </a>
            </div>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-4 text-[--af-text-secondary] dark:text-[--af-text-muted]">
            <p>
              Whether you&apos;re an architecture firm looking for a better way to
              manage projects, have a feature request, or want to report an issue —
              reach out and we&apos;ll get back to you as soon as possible.
            </p>
            <p>
              ArchaFlow is currently in beta, and your feedback directly shapes what
              we build next.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-[--af-text-secondary] mt-6">
          &copy; 2026 ArchaFlow. All rights reserved.
        </p>
      </div>
    </div>
  )
}
