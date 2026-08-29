import { cookies } from "next/headers"
import { redirect } from "next/navigation"

async function checkAdmin() {
  const c = await cookies()
  const token = c.get("session")?.value
  if (!token) return null
  try {
    const res = await fetch(`http://localhost:4000/api/auth/session`, {
      headers: { cookie: `session=${token}` },
      cache: "no-store",
    })
    const j = await res.json()
    return j.user
  } catch { return null }
}

export default async function AdminPage() {
  const user = await checkAdmin()
  if (!user) redirect("/login?next=/admin")
  if (user.role !== "admin") redirect("/profile")
  return (
    <div style={{padding:'80px 20px',maxWidth:1200,margin:'0 auto'}}>
      <h1 style={{fontSize:32,fontWeight:800,fontFamily:'Syne'}}>Admin <span style={{background:'linear-gradient(135deg,#e6e3dc,#93ab9e)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Panel</span></h1>
      <p style={{color:'var(--text-muted)',marginTop:12}}>Halo {user.name} ({user.email}) — proteksi server aktif via middleware + server check.</p>
      <p style={{marginTop:16,fontSize:13}}>API admin tetap di Express: <a href="/api/admin/users" style={{textDecoration:'underline'}}>/api/admin/users</a> (butuh cookie admin)</p>
    </div>
  )
}
