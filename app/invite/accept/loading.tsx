export default function InviteAcceptLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[--af-bg-canvas]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 bg-[--af-brand] rounded-lg flex items-center justify-center animate-pulse">
          <div className="w-5 h-5 border-2 border-[--af-text-inverse] rotate-45" />
        </div>
        <p className="text-sm text-[--af-text-muted]">Loading...</p>
      </div>
    </div>
  )
}
