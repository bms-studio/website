"use client"
import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

export function PageTransition({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // GSAP-like fade + slide without GSAP dependency (safe for low-end)
    el.style.opacity = "0"
    el.style.transform = "translateY(8px)"
    const raf = requestAnimationFrame(() => {
      el.style.transition = "opacity 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.35s cubic-bezier(0.16,1,0.3,1)"
      el.style.opacity = "1"
      el.style.transform = "translateY(0)"
    })
    return () => cancelAnimationFrame(raf)
  }, [pathname])

  return <div ref={ref}>{children}</div>
}
