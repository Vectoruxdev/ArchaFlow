import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service - ArchaFlow",
  description: "ArchaFlow Terms of Service",
}

export default function TermsPage() {
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
          <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Terms of Service</h1>
          <p className="text-sm text-[--af-text-muted] mb-8">
            Last updated: February 17, 2026
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-[--af-text-secondary] dark:text-[--af-text-muted]">
            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using ArchaFlow (&quot;the Service&quot;), you agree to be bound by
                these Terms of Service. If you do not agree to these terms, you may not use the
                Service. These terms apply to all users, including workspace owners, members, and
                guests.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                2. Description of Service
              </h2>
              <p>
                ArchaFlow is a project management platform designed for architecture professionals.
                The Service provides tools for task management, project workflows, document
                collaboration, AI-assisted features, and team coordination. We reserve the right to
                modify, suspend, or discontinue any part of the Service at any time with reasonable
                notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                3. Account Registration
              </h2>
              <p>
                To use the Service, you must create an account with accurate and complete
                information. You are responsible for maintaining the confidentiality of your account
                credentials and for all activities that occur under your account. You must notify us
                immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                4. Workspaces and Collaboration
              </h2>
              <p>
                Workspace owners are responsible for managing their workspace members and settings.
                Content shared within a workspace is accessible to all members of that workspace.
                Workspace owners may invite or remove members and configure workspace-level
                permissions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                5. Acceptable Use
              </h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Use the Service for any unlawful purpose</li>
                <li>Upload or share malicious content, viruses, or harmful code</li>
                <li>Attempt to gain unauthorized access to other accounts or systems</li>
                <li>Interfere with or disrupt the Service or its infrastructure</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Use the Service to send unsolicited communications or spam</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                6. Intellectual Property
              </h2>
              <p>
                You retain ownership of all content you upload to the Service. By using the Service,
                you grant ArchaFlow a limited license to store, process, and display your content
                solely for the purpose of providing the Service. ArchaFlow and its logos, features,
                and functionality are owned by ArchaFlow and protected by intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                7. AI-Powered Features
              </h2>
              <p>
                The Service includes AI-powered features that may process your project data to
                provide suggestions, summaries, and other assistance. AI-generated content is
                provided as-is and should be reviewed before reliance. You acknowledge that AI
                outputs may not always be accurate and should not be used as a sole basis for
                professional decisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                8. Payment and Billing
              </h2>
              <p>
                Certain features of the Service may require a paid subscription. Payment terms,
                pricing, and billing cycles will be presented at the time of purchase. You are
                responsible for all charges incurred under your account. We reserve the right to
                change pricing with 30 days&apos; notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                9. Termination
              </h2>
              <p>
                You may terminate your account at any time by contacting us or through your account
                settings. We may suspend or terminate your account if you violate these terms or for
                any other reason with reasonable notice. Upon termination, your right to use the
                Service ceases immediately. We will make your data available for export for a
                reasonable period following termination.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                10. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by law, ArchaFlow shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages, including but not
                limited to loss of profits, data, or business opportunities. The Service is provided
                &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either
                express or implied.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                11. Indemnification
              </h2>
              <p>
                You agree to indemnify and hold harmless ArchaFlow, its officers, directors,
                employees, and agents from any claims, damages, or expenses arising from your use of
                the Service or violation of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                12. Changes to Terms
              </h2>
              <p>
                We may update these Terms of Service from time to time. We will notify you of
                material changes by posting the updated terms on this page and updating the &quot;Last
                updated&quot; date. Your continued use of the Service after changes constitutes
                acceptance of the revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                13. Governing Law
              </h2>
              <p>
                These terms shall be governed by and construed in accordance with the laws of the
                United States. Any disputes arising from these terms or your use of the Service shall
                be resolved through binding arbitration.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold tracking-tight text-foreground mb-3">
                14. Contact Us
              </h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at{" "}
                <a
                  href="mailto:legal@archaflow.com"
                  className="text-foreground underline"
                >
                  legal@archaflow.com
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
