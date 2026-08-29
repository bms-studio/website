import { NextResponse, NextRequest } from "next/server"

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!pathname.startsWith("/admin")) return NextResponse.next()

  const token = req.cookies.get("session")?.value
  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  try {
    const apiUrl = process.env.API_URL || "http://localhost:4000"
    const res = await fetch(`${apiUrl}/api/auth/session`, {
      headers: { cookie: `session=${token}` },
      cache: "no-store",
    })
    const j = await res.json()
    if (!j.user || j.user.role !== "admin") {
      const url = req.nextUrl.clone()
      url.pathname = "/profile"
      return NextResponse.redirect(url)
    }
  } catch {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
