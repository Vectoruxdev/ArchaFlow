"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect")
  const emailParam = searchParams.get("email")
  const isInviteFlow = redirect?.includes("/invite/accept") ?? false

  const { signUp, signUpWithoutWorkspace } = useAuth()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [workspaceName, setWorkspaceName] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  useEffect(() => {
    if (emailParam) setEmail(emailParam)
  }, [emailParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (!acceptedTerms) {
      setError("You must accept the terms and conditions")
      return
    }

    setLoading(true)

    try {
      if (isInviteFlow) {
        // Invite flow: create user + workspace, then redirect to invite accept
        await signUp(email, password, fullName, workspaceName || `${fullName}'s Workspace`)
        router.push(redirect ?? "/workflow")
      } else {
        // Normal signup: create user only, then go to onboarding
        await signUpWithoutWorkspace(email, password, fullName)
        router.push("/onboarding")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Create your account</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Get started with ArchaFlow today
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium mb-2">
            Full Name
          </label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
          />
        </div>

        {isInviteFlow && (
          <div>
            <label htmlFor="workspaceName" className="block text-sm font-medium mb-2">
              Workspace Name <span className="text-gray-500">(Optional)</span>
            </label>
            <Input
              id="workspaceName"
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder=""
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              You&apos;re joining an existing workspace — leave blank.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Must be at least 8 characters
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
          />
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
            disabled={loading}
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
            I agree to the{" "}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="text-foreground hover:underline font-medium"
            >
              Terms of Service
            </button>{" "}
            and{" "}
            <button
              type="button"
              onClick={() => setShowPrivacy(true)}
              className="text-foreground hover:underline font-medium"
            >
              Privacy Policy
            </button>
          </label>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-black dark:text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      {/* Terms of Service Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
            <p className="text-sm text-muted-foreground">Last updated: February 17, 2026</p>
          </DialogHeader>
          <div className="space-y-6 text-sm text-muted-foreground">
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">1. Acceptance of Terms</h3>
              <p>By accessing or using ArchaFlow (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service. These terms apply to all users, including workspace owners, members, and guests.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">2. Description of Service</h3>
              <p>ArchaFlow is a project management platform designed for architecture professionals. The Service provides tools for task management, project workflows, document collaboration, AI-assisted features, and team coordination. We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">3. Account Registration</h3>
              <p>To use the Service, you must create an account with accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">4. Workspaces and Collaboration</h3>
              <p>Workspace owners are responsible for managing their workspace members and settings. Content shared within a workspace is accessible to all members of that workspace. Workspace owners may invite or remove members and configure workspace-level permissions.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">5. Acceptable Use</h3>
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
              <h3 className="text-base font-semibold text-foreground mb-2">6. Intellectual Property</h3>
              <p>You retain ownership of all content you upload to the Service. By using the Service, you grant ArchaFlow a limited license to store, process, and display your content solely for the purpose of providing the Service. ArchaFlow and its logos, features, and functionality are owned by ArchaFlow and protected by intellectual property laws.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">7. AI-Powered Features</h3>
              <p>The Service includes AI-powered features that may process your project data to provide suggestions, summaries, and other assistance. AI-generated content is provided as-is and should be reviewed before reliance. You acknowledge that AI outputs may not always be accurate and should not be used as a sole basis for professional decisions.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">8. Payment and Billing</h3>
              <p>Certain features of the Service may require a paid subscription. Payment terms, pricing, and billing cycles will be presented at the time of purchase. You are responsible for all charges incurred under your account. We reserve the right to change pricing with 30 days&apos; notice.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">9. Termination</h3>
              <p>You may terminate your account at any time by contacting us or through your account settings. We may suspend or terminate your account if you violate these terms or for any other reason with reasonable notice. Upon termination, your right to use the Service ceases immediately. We will make your data available for export for a reasonable period following termination.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">10. Limitation of Liability</h3>
              <p>To the maximum extent permitted by law, ArchaFlow shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities. The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">11. Indemnification</h3>
              <p>You agree to indemnify and hold harmless ArchaFlow, its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Service or violation of these terms.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">12. Changes to Terms</h3>
              <p>We may update these Terms of Service from time to time. We will notify you of material changes by posting the updated terms on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after changes constitutes acceptance of the revised terms.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">13. Governing Law</h3>
              <p>These terms shall be governed by and construed in accordance with the laws of the United States. Any disputes arising from these terms or your use of the Service shall be resolved through binding arbitration.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">14. Contact Us</h3>
              <p>If you have any questions about these Terms of Service, please contact us at <a href="mailto:legal@archaflow.com" className="text-foreground underline">legal@archaflow.com</a>.</p>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
            <p className="text-sm text-muted-foreground">Last updated: February 17, 2026</p>
          </DialogHeader>
          <div className="space-y-6 text-sm text-muted-foreground">
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">1. Introduction</h3>
              <p>ArchaFlow (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and share your information when you use our project management platform designed for architecture professionals.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">2. Information We Collect</h3>
              <h4 className="font-medium text-foreground mb-1 mt-3">Account Information</h4>
              <p>When you create an account, we collect your name, email address, and password. If you create or join a workspace, we collect workspace names and membership information.</p>
              <h4 className="font-medium text-foreground mb-1 mt-3">Project Data</h4>
              <p>We collect and store the content you create within the Service, including projects, tasks, documents, comments, attachments, and any other data you input into the platform.</p>
              <h4 className="font-medium text-foreground mb-1 mt-3">Usage Data</h4>
              <p>We automatically collect information about how you interact with the Service, including pages visited, features used, actions taken, and timestamps. This data helps us improve the Service.</p>
              <h4 className="font-medium text-foreground mb-1 mt-3">Device Information</h4>
              <p>We may collect information about the device you use to access the Service, including browser type, operating system, and IP address.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">3. How We Use Your Information</h3>
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
              <h3 className="text-base font-semibold text-foreground mb-2">4. Third-Party Services</h3>
              <p>We use the following third-party services to operate the platform:</p>
              <h4 className="font-medium text-foreground mb-1 mt-3">Supabase</h4>
              <p>We use Supabase for authentication, database storage, and file storage. Your account data and project content are stored in Supabase&apos;s infrastructure.</p>
              <h4 className="font-medium text-foreground mb-1 mt-3">Anthropic (Claude AI)</h4>
              <p>We use Anthropic&apos;s AI models to power AI-assisted features within the Service. When you use AI features, relevant project data may be sent to Anthropic for processing. We do not use your data to train AI models.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">5. Data Storage and Security</h3>
              <p>We implement appropriate technical and organizational measures to protect your data against unauthorized access, alteration, disclosure, or destruction. Your data is encrypted in transit using TLS and at rest. However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">6. Cookies and Tracking</h3>
              <p>We use essential cookies to maintain your authentication session and remember your preferences. We do not use third-party advertising or tracking cookies.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">7. Data Sharing</h3>
              <p>We do not sell your personal information. We may share your data only in the following circumstances:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Within your workspace:</strong> Data you create is accessible to other members of the same workspace</li>
                <li><strong>Service providers:</strong> With third-party services described in Section 4, solely to operate the platform</li>
                <li><strong>Legal requirements:</strong> When required by law, regulation, or legal process</li>
                <li><strong>Safety:</strong> To protect the rights, property, or safety of ArchaFlow, our users, or the public</li>
              </ul>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">8. Your Rights</h3>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Access and receive a copy of your personal data</li>
                <li>Correct inaccurate personal data</li>
                <li>Request deletion of your personal data</li>
                <li>Export your project data in a portable format</li>
                <li>Object to or restrict certain processing of your data</li>
                <li>Withdraw consent at any time where processing is based on consent</li>
              </ul>
              <p className="mt-2">To exercise any of these rights, please contact us at <a href="mailto:privacy@archaflow.com" className="text-foreground underline">privacy@archaflow.com</a>.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">9. Data Retention</h3>
              <p>We retain your data for as long as your account is active or as needed to provide the Service. When you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal or regulatory purposes.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">10. Children&apos;s Privacy</h3>
              <p>The Service is not intended for children under the age of 16. We do not knowingly collect personal information from children under 16.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">11. Changes to This Policy</h3>
              <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the &quot;Last updated&quot; date.</p>
            </section>
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">12. Contact Us</h3>
              <p>If you have any questions about this Privacy Policy or our data practices, please contact us at <a href="mailto:privacy@archaflow.com" className="text-foreground underline">privacy@archaflow.com</a>.</p>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]">Loading...</div>}>
      <SignupContent />
    </Suspense>
  )
}
