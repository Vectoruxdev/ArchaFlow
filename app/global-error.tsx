"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          @media (prefers-color-scheme: dark) {
            body { background-color: #030712; color: #f3f4f6; }
            .ge-heading { color: #f3f4f6; }
            .ge-message { color: #9ca3af; }
            .ge-button { background-color: #fff; color: #000; }
          }
        `}</style>
      </head>
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: "28rem" }}>
          <h2 className="ge-heading" style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Something went wrong</h2>
          <p className="ge-message" style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1rem" }}>
            {error?.message || "An unexpected error occurred."}
          </p>
          <button
            className="ge-button"
            onClick={() => reset()}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#000",
              color: "#fff",
              border: "none",
              borderRadius: "0.375rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
