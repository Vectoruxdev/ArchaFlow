"use client"

import { useEffect, useState } from "react"
import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const html = document.documentElement
    const update = () =>
      setTheme(html.classList.contains("dark") ? "dark" : "light")

    update()

    const observer = new MutationObserver(update)
    observer.observe(html, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return (
    <SonnerToaster
      theme={theme}
      position="bottom-right"
      richColors
      closeButton
    />
  )
}
