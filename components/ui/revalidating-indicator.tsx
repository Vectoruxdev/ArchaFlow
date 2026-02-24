"use client"

export function RevalidatingIndicator({ isRevalidating }: { isRevalidating: boolean }) {
  if (!isRevalidating) return null

  return (
    <div className="fixed top-14 left-0 right-0 z-50 h-0.5 overflow-hidden">
      <div className="h-full bg-[--af-brand] animate-[revalidate_1.5s_ease-in-out_infinite] origin-left" />
      <style jsx>{`
        @keyframes revalidate {
          0% { transform: scaleX(0); transform-origin: left; }
          50% { transform: scaleX(1); transform-origin: left; }
          50.1% { transform: scaleX(1); transform-origin: right; }
          100% { transform: scaleX(0); transform-origin: right; }
        }
      `}</style>
    </div>
  )
}
