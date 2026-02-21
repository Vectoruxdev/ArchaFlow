"use client"

import { useState } from "react"
import {
  Heading,
  Text,
  Spinner,
  Alert,
  Skeleton,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  PageLoader,
} from "@/components/design-system"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/lib/toast"

const buttonVariantList = ["default", "secondary", "destructive", "outline", "ghost", "link", "brand"] as const
const buttonSizes = ["sm", "default", "lg", "icon"] as const
const badgeVariantList = ["default", "secondary", "destructive", "outline", "success", "warning", "danger", "info", "brand"] as const
const spinnerSizes = ["sm", "md", "lg"] as const
const alertVariants = ["info", "success", "warning", "error"] as const

export default function ComponentsSection() {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [switchChecked, setSwitchChecked] = useState(true)
  const [checkboxChecked, setCheckboxChecked] = useState(true)

  const dismissAlert = (v: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(v))
  }

  const resetAlerts = () => setDismissedAlerts(new Set())

  return (
    <section id="components">
      <Heading size="lg" className="mb-6">Components</Heading>

      <div className="space-y-12">
        {/* Buttons */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Button
          </Text>
          <div className="bg-[--af-bg-surface] rounded-card border border-[--af-border-default] p-6 space-y-6">
            <div>
              <Text size="xs" color="muted" mono className="mb-3">7 Variants</Text>
              <div className="flex flex-wrap gap-3">
                {buttonVariantList.map((v) => (
                  <Button key={v} variant={v}>
                    {v}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Text size="xs" color="muted" mono className="mb-3">4 Sizes</Text>
              <div className="flex flex-wrap items-center gap-3">
                {buttonSizes.map((s) => (
                  <Button key={s} size={s}>
                    {s === "icon" ? "+" : s}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Text size="xs" color="muted" mono className="mb-3">States</Text>
              <div className="flex flex-wrap items-center gap-3">
                <Button>Enabled</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Badge — all 9 variants */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Badge
          </Text>
          <div className="bg-[--af-bg-surface] rounded-card border border-[--af-border-default] p-6">
            <Text size="xs" color="muted" mono className="mb-3">9 Variants</Text>
            <div className="flex flex-wrap gap-3">
              {badgeVariantList.map((v) => (
                <Badge key={v} variant={v}>
                  {v}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Form Inputs */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Form Inputs
          </Text>
          <div className="bg-[--af-bg-surface] rounded-card border border-[--af-border-default] p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Text size="xs" color="muted" mono>Input</Text>
                <Input placeholder="Enter project name..." />
              </div>
              <div className="space-y-1.5">
                <Text size="xs" color="muted" mono>Input (disabled)</Text>
                <Input placeholder="Disabled input" disabled />
              </div>
            </div>
            <div className="space-y-1.5">
              <Text size="xs" color="muted" mono>Textarea</Text>
              <Textarea placeholder="Write a description..." rows={3} />
            </div>
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-3">
                <Text size="xs" color="muted" mono>Switch</Text>
                <Switch checked={switchChecked} onCheckedChange={setSwitchChecked} />
                <Text size="xs" color={switchChecked ? "success" : "muted"}>
                  {switchChecked ? "On" : "Off"}
                </Text>
              </div>
              <div className="flex items-center gap-3">
                <Text size="xs" color="muted" mono>Checkbox</Text>
                <Checkbox
                  checked={checkboxChecked}
                  onCheckedChange={(v) => setCheckboxChecked(v === true)}
                />
                <Text size="xs" color={checkboxChecked ? "primary" : "muted"}>
                  {checkboxChecked ? "Checked" : "Unchecked"}
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Tabs
          </Text>
          <div className="bg-[--af-bg-surface] rounded-card border border-[--af-border-default] p-6">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <Text color="secondary" className="pt-3">Overview tab content — project details would appear here.</Text>
              </TabsContent>
              <TabsContent value="activity">
                <Text color="secondary" className="pt-3">Activity tab content — recent actions and timeline.</Text>
              </TabsContent>
              <TabsContent value="settings">
                <Text color="secondary" className="pt-3">Settings tab content — configuration options.</Text>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Spinner */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Spinner
          </Text>
          <div className="bg-[--af-bg-surface] rounded-card border border-[--af-border-default] p-6">
            <div className="flex items-center gap-6">
              {spinnerSizes.map((s) => (
                <div key={s} className="flex flex-col items-center gap-2">
                  <Spinner size={s} />
                  <Text size="xs" color="muted" mono>{s}</Text>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alert */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Alert
          </Text>
          <div className="space-y-3">
            {alertVariants.map((v) =>
              dismissedAlerts.has(v) ? null : (
                <Alert
                  key={v}
                  variant={v}
                  title={`${v.charAt(0).toUpperCase() + v.slice(1)} Alert`}
                  dismissible
                  onDismiss={() => dismissAlert(v)}
                >
                  This is an example {v} message for the design system.
                </Alert>
              )
            )}
            {dismissedAlerts.size > 0 && (
              <Button variant="ghost" size="sm" onClick={resetAlerts}>
                Reset alerts
              </Button>
            )}
          </div>
        </div>

        {/* Toast */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Toast
          </Text>
          <div className="bg-[--af-bg-surface] rounded-card border border-[--af-border-default] p-6">
            <Text size="xs" color="muted" mono className="mb-3">
              import {"{ toast }"} from &quot;@/lib/toast&quot;
            </Text>
            <div className="flex flex-wrap gap-3">
              <Button size="sm" variant="outline" onClick={() => toast.success("Changes saved successfully")}>
                toast.success()
              </Button>
              <Button size="sm" variant="outline" onClick={() => toast.error("Something went wrong")}>
                toast.error()
              </Button>
              <Button size="sm" variant="outline" onClick={() => toast.warning("Approaching usage limit")}>
                toast.warning()
              </Button>
              <Button size="sm" variant="outline" onClick={() => toast.info("New update available")}>
                toast.info()
              </Button>
              <Button size="sm" variant="outline" onClick={() => toast.message("Hello from the design system")}>
                toast.message()
              </Button>
            </div>
          </div>
        </div>

        {/* Skeleton */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Skeleton
          </Text>
          <div className="bg-[--af-bg-surface] rounded-card border border-[--af-border-default] p-6 space-y-3">
            <Skeleton width="60%" height={16} rounded="sm" />
            <Skeleton width="100%" height={12} rounded="sm" />
            <Skeleton width="80%" height={12} rounded="sm" />
            <div className="flex gap-3 mt-4">
              <Skeleton width={40} height={40} rounded="full" />
              <div className="flex-1 space-y-2">
                <Skeleton width="40%" height={14} rounded="sm" />
                <Skeleton width="70%" height={10} rounded="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Card */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Card
          </Text>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Heading size="sm">Basic Card</Heading>
              </CardHeader>
              <CardBody>
                <Text color="secondary">
                  A composable card with header, body, and footer slots. Uses design system tokens for border radius, shadow, and colors.
                </Text>
              </CardBody>
              <CardFooter>
                <Button variant="ghost" size="sm">Cancel</Button>
                <Button size="sm">Save</Button>
              </CardFooter>
            </Card>

            <Card hoverable>
              <CardBody>
                <Heading size="sm" className="mb-2">Hoverable Card</Heading>
                <Text color="secondary">
                  Hover over this card to see the elevated shadow and stronger border. Great for clickable list items.
                </Text>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Text & Heading combos */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Text &amp; Heading
          </Text>
          <Card>
            <CardBody className="space-y-3">
              <Heading size="md">Project Overview</Heading>
              <Text color="secondary">
                This is how Heading and Text compose together in a real layout. The heading uses the display font while body text uses Inter.
              </Text>
              <Text size="xs" color="muted" mono>
                Last updated 2 hours ago
              </Text>
            </CardBody>
          </Card>
        </div>

        {/* PageLoader */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            PageLoader
          </Text>
          <div className="bg-[--af-bg-surface] rounded-card border border-[--af-border-default] h-48 overflow-hidden">
            <PageLoader message="Loading project data..." className="min-h-0 h-full" />
          </div>
        </div>
      </div>
    </section>
  )
}
