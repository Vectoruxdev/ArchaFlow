/**
 * ArchaFlow — Toast Utility
 *
 * Thin wrapper around sonner for a single import path.
 * API-compatible with `import { toast } from "sonner"` for gradual migration.
 *
 * Usage:
 *   import { toast } from "@/lib/toast"
 *   toast.success("Saved!")
 *   toast.error("Something went wrong")
 *   toast.promise(asyncFn(), { loading: "Saving...", success: "Done!", error: "Failed" })
 */

import { toast as sonnerToast } from "sonner"

export const toast = {
  success: (message: string, opts?: Parameters<typeof sonnerToast.success>[1]) =>
    sonnerToast.success(message, opts),

  error: (message: string, opts?: Parameters<typeof sonnerToast.error>[1]) =>
    sonnerToast.error(message, opts),

  warning: (message: string, opts?: Parameters<typeof sonnerToast.warning>[1]) =>
    sonnerToast.warning(message, opts),

  info: (message: string, opts?: Parameters<typeof sonnerToast.info>[1]) =>
    sonnerToast.info(message, opts),

  message: (message: string, opts?: Parameters<typeof sonnerToast>[1]) =>
    sonnerToast(message, opts),

  dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),

  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    opts: Parameters<typeof sonnerToast.promise<T>>[1]
  ) => sonnerToast.promise(promise, opts),
}
