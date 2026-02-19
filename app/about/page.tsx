import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About - ArchaFlow",
  description: "About ArchaFlow — project management built for architecture firms",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white dark:border-black rotate-45" />
            </div>
            <span className="font-semibold text-2xl">ArchaFlow</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
          >
            &larr; Back to Home
          </Link>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-3xl font-bold mb-6">About ArchaFlow</h1>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-black dark:text-white mb-3">
                Our Mission
              </h2>
              <p>
                ArchaFlow was built to solve a simple problem: architecture firms
                deserve project management tools that understand how they actually
                work. Generic PM software forces firms to adapt their workflows to
                rigid templates. We believe the software should adapt to you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-black dark:text-white mb-3">
                Why We Exist
              </h2>
              <p>
                Architecture projects are unique. They move through design phases,
                require coordination across consultants, involve complex budgets with
                AIA billing, and demand real-time visibility across the entire firm.
                Spreadsheets break down. Generic tools add friction. ArchaFlow was
                purpose-built to handle the complexity of architecture project
                management from day one.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-black dark:text-white mb-3">
                What We Do
              </h2>
              <p>
                ArchaFlow is a single platform where architecture firms can plan
                projects, track budgets, assign tasks, manage documents, and
                collaborate — from concept to completion. With AI-powered insights,
                smart workflows, and real-time dashboards, your team spends less
                time on admin and more time designing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-black dark:text-white mb-3">
                Currently in Beta
              </h2>
              <p>
                ArchaFlow is currently in beta. We&apos;re actively building new
                features and refining the platform based on feedback from real
                architecture firms. If you&apos;d like to be part of shaping the
                future of architecture project management, we&apos;d love to hear
                from you.
              </p>
              <p className="mt-2">
                Get in touch at{" "}
                <a
                  href="mailto:jared@archaflow.com"
                  className="text-black dark:text-white underline"
                >
                  jared@archaflow.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          &copy; 2026 ArchaFlow. All rights reserved.
        </p>
      </div>
    </div>
  )
}
