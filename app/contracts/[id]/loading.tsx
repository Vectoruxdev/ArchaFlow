import { AppLayout } from "@/components/layout/app-layout"
import { DetailSkeleton } from "@/components/ui/skeletons"

export default function ContractDetailLoading() {
  return <AppLayout><div style={{ padding: "var(--af-density-page-padding)" }}><DetailSkeleton /></div></AppLayout>
}
