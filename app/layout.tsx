import "./globals.css"
import type { Metadata } from "next"

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
        <nav style={{height:'var(--nav-height)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',borderBottom:'1px solid var(--glass-border)',position:'sticky',top:0,zIndex:50,background:'rgba(6,6,8,0.8)',backdropFilter:'blur(12px)'}}>
          <a href="/home" style={{fontWeight:800,fontFamily:'Syne'}}>BMS Platform</a>
          <div style={{display:'flex',gap:12,fontSize:13}}>
            <a href="/home">Home</a><a href="/about">About</a><a href="/services">Services</a><a href="/portfolio">Portfolio</a><a href="/store">Store</a><a href="/admin">Admin</a>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
