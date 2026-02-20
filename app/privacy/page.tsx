import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - ArchaFlow",
  description: "ArchaFlow Privacy Policy",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[--af-bg-canvas] dark:bg-warm-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/signup" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-warm-900 dark:bg-[--af-bg-surface] rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white dark:border-foreground rotate-45" />
            </div>
            <span className="font-semibold text-2xl">ArchaFlow</span>
          </Link>
          <Link
            href="/signup"
            className="text-sm text-[--af-text-secondary] hover:text-foreground dark:hover:text-white"
          >
            &larr; Back to Sign Up
          </Link>
        </div>

        {/* Content */}
        <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-sm text-[--af-text-muted] mb-8">
            Last updated: February 17, 2026
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-[--af-text-secondary] dark:text-[--af-text-muted]">
            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                1. Introduction
              </h2>
              <p>
                ArchaFlow (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting
                your privacy. This Privacy Policy explains how we collect, use, store, and share your
                information when you use our project management platform designed for architecture
                professionals.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                2. Information We Collect
              </h2>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Account Information
              </h3>
              <p>
                When you create an account, we collect your name, email address, and password. If you
                create or join a workspace, we collect workspace names and membership information.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2 mt-4">
                Project Data
              </h3>
              <p>
                We collect and store the content you create within the Service, including projects,
                tasks, documents, comments, attachments, and any other data you input into the
                platform.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2 mt-4">
                Usage Data
              </h3>
              <p>
                We automatically collect information about how you interact with the Service,
                including pages visited, features used, actions taken, and timestamps. This data
                helps us improve the Service.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2 mt-4">
                Device Information
              </h3>
              <p>
                We may collect information about the device you use to access the Service, including
                browser type, operating system, and IP address.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                3. How We Use Your Information
              </h2>
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Provide, maintain, and improve the Service</li>
                <li>Authenticate your identity and manage your account</li>
                <li>Enable collaboration features within workspaces</li>
                <li>Power AI-assisted features such as task suggestions and project summaries</li>
                <li>Send important notifications about your account or the Service</li>
                <li>Analyze usage patterns to improve user experience</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                4. Third-Party Services
              </h2>
              <p>We use the following third-party services to operate the platform:</p>

              <h3 className="text-lg font-medium text-foreground mb-2 mt-4">
                Supabase
              </h3>
              <p>
                We use Supabase for authentication, database storage, and file storage. Your account
                data and project content are stored in Supabase&apos;s infrastructure. Supabase
                processes data in accordance with their{" "}
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline"
                >
                  Privacy Policy
                </a>
                .
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2 mt-4">
                Anthropic (Claude AI)
              </h3>
              <p>
                We use Anthropic&apos;s AI models to power AI-assisted features within the Service.
                When you use AI features, relevant project data may be sent to Anthropic for
                processing. Anthropic processes this data in accordance with their{" "}
                <a
                  href="https://www.anthropic.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline"
                >
                  Privacy Policy
                </a>
                . We do not use your data to train AI models.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                5. Data Storage and Security
              </h2>
              <p>
                We implement appropriate technical and organizational measures to protect your data
                against unauthorized access, alteration, disclosure, or destruction. Your data is
                encrypted in transit using TLS and at rest. However, no method of electronic
                transmission or storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                6. Cookies and Tracking
              </h2>
              <p>
                We use essential cookies to maintain your authentication session and remember your
                preferences. We do not use third-party advertising or tracking cookies. Session
                cookies are automatically deleted when you close your browser. Persistent cookies for
                preferences are stored until you clear them or they expire.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                7. Data Sharing
              </h2>
              <p>
                We do not sell your personal information. We may share your data only in the
                following circumstances:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>
                  <strong>Within your workspace:</strong> Data you create is accessible to other
                  members of the same workspace
                </li>
                <li>
                  <strong>Service providers:</strong> With third-party services described in Section
                  4, solely to operate the platform
                </li>
                <li>
                  <strong>Legal requirements:</strong> When required by law, regulation, or legal
                  process
                </li>
                <li>
                  <strong>Safety:</strong> To protect the rights, property, or safety of ArchaFlow,
                  our users, or the public
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                8. Your Rights
              </h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Access and receive a copy of your personal data</li>
                <li>Correct inaccurate personal data</li>
                <li>Request deletion of your personal data</li>
                <li>Export your project data in a portable format</li>
                <li>Object to or restrict certain processing of your data</li>
                <li>Withdraw consent at any time where processing is based on consent</li>
              </ul>
              <p className="mt-2">
                To exercise any of these rights, please contact us at{" "}
                <a
                  href="mailto:privacy@archaflow.com"
                  className="text-foreground underline"
                >
                  privacy@archaflow.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                9. Data Retention
              </h2>
              <p>
                We retain your data for as long as your account is active or as needed to provide the
                Service. When you delete your account, we will delete your personal data within 30
                days, except where we are required to retain it for legal or regulatory purposes.
                Workspace data may be retained if the workspace remains active with other members.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                10. Children&apos;s Privacy
              </h2>
              <p>
                The Service is not intended for children under the age of 16. We do not knowingly
                collect personal information from children under 16. If we discover that we have
                collected information from a child under 16, we will delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                11. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material
                changes by posting the updated policy on this page and updating the &quot;Last
                updated&quot; date. We encourage you to review this policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                12. Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please
                contact us at{" "}
                <a
                  href="mailto:privacy@archaflow.com"
                  className="text-foreground underline"
                >
                  privacy@archaflow.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[--af-text-secondary] mt-6">
          &copy; 2026 ArchaFlow. All rights reserved.
        </p>
      </div>
    </div>
  )
}
