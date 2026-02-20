import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Careers - ArchaFlow",
  description: "Join the ArchaFlow team",
}

export default function CareersPage() {
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
          <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Careers</h1>
          <p className="text-[--af-text-muted] mb-8">
            Help us build the future of architecture project management.
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-[--af-text-secondary] dark:text-[--af-text-muted]">
            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                We&apos;re Just Getting Started
              </h2>
              <p>
                ArchaFlow is currently in beta and growing fast. We&apos;re a small
                team with big ambitions — building the project management platform
                that architecture firms have been waiting for.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                Open Positions
              </h2>
              <p>
                We don&apos;t have any formal openings listed right now, but
                we&apos;re always interested in hearing from talented people who are
                passionate about building great software for the architecture
                industry.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                Get in Touch
              </h2>
              <p>
                If you&apos;re interested in joining us, send an email with a bit
                about yourself to{" "}
                <a
                  href="mailto:jared@archaflow.com"
                  className="text-foreground underline"
                >
                  jared@archaflow.com
                </a>
                . We&apos;d love to hear from you.
              </p>
            </section>
          </div>
        </div>

        <p className="text-center text-sm text-[--af-text-secondary] mt-6">
          &copy; 2026 ArchaFlow. All rights reserved.
        </p>
      </div>
    </div>
  )
}
