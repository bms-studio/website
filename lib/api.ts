const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

async function request(path: string, options: any, config: any) {
  const url = path.startsWith("http") ? path : `${API_BASE}/api${path.startsWith("/") ? path : "/" + path}`
  const res = await fetch(url, config)
  const text = await res.text()
  let data: any = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`)
  return data
}

export async function api(path: string, options: any = {}) {
  const { headers: optHeaders, cache = true, method = "GET", ...rest } = options
  const config: any = { headers: { "Content-Type": "application/json", ...optHeaders }, credentials: "include" as const, method, ...rest }
  if (config.body && typeof config.body === "object") config.body = JSON.stringify(config.body)

  if (method !== "GET") return request(path, options, config)

  // simple SWR via localStorage if available (client only)
  if (typeof window !== "undefined" && cache) {
    try {
      const key = "api_cache_" + path
      const cached = localStorage.getItem(key)
      if (cached) {
        const { data, time } = JSON.parse(cached)
        if (Date.now() - time < 30000) return data
      }
    } catch {}
  }

  const data = await request(path, options, config)
  if (typeof window !== "undefined" && cache) {
    try { localStorage.setItem("api_cache_" + path, JSON.stringify({ data, time: Date.now() })) } catch {}
  }
  return data
}
