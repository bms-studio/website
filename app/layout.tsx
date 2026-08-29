import "./globals.css"
import type { Metadata } from "next"
import { StoreProvider } from "@/lib/store"
import { PageTransition } from "@/components/ui/PageTransition"

export const metadata: Metadata = {
  metadataBase: new URL("https://bms-platfrom.vercel.app"),
  title: "BMS Platform - Premium Development & Digital Store",
  description: "BMS Platform - Premium Roblox Development, Digital Products & Creative Solutions.",
  openGraph: {
    title: "BMS Platform - Premium Development & Digital Store",
    description: "BMS Platform - Premium Roblox Development, Digital Products & Creative Solutions.",
    images: ["/logo-bms-256.png"],
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme="dark">
      <body>
        <StoreProvider>
          <nav style={{height:'var(--nav-height)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',borderBottom:'1px solid var(--glass-border)',position:'sticky',top:0,zIndex:50,background:'rgba(6,6,8,0.8)',backdropFilter:'blur(12px)'}}>
            <a href="/home" style={{fontWeight:800,fontFamily:'Syne',display:'flex',alignItems:'center',gap:8}}><img src="/logo-bms-64.png" alt="" style={{width:28,height:28,borderRadius:8}}/>BMS Platform</a>
            <div style={{display:'flex',gap:14,fontSize:13,alignItems:'center'}}>
              <a href="/home">Home</a><a href="/store">Store</a><a href="/public-store">Public</a><a href="/cart">Cart</a><a href="/profile">Profile</a><a href="/admin" style={{padding:'6px 12px',background:'var(--glass)',borderRadius:100,border:'1px solid var(--glass-border)'}}>Admin</a>
            </div>
          </nav>
          <main><PageTransition>{children}</PageTransition></main>
        </StoreProvider>
      </body>
    </html>
  )
}
