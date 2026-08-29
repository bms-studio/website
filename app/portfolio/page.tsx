"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

export default function PortfolioPage() {
  const [items, setItems] = useState<any[]>([])
  useEffect(()=>{ api("/portfolio").then(d=>setItems(d.portfolio||d.items||[])).catch(()=>{}) },[])
  return (
    <div style={{maxWidth:1200,margin:'0 auto',padding:'80px 20px'}}>
      <h1 style={{fontSize:36,fontWeight:800,fontFamily:'Syne'}}>Our <span style={{background:'var(--gradient-1)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Portfolio</span></h1>
      <p style={{color:'var(--text-muted)',marginTop:8}}>Beberapa project yang telah kami kerjakan.</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16,marginTop:32}}>
        {(items.length?items:[
          {title:'E-Commerce Platform',desc:'Full-stack dengan payment gateway',category:'Web',color:'#e6e3dc'},
          {title:'Adventure Quest RPG',desc:'Roblox open-world',category:'Roblox',color:'#93ab9e'},
          {title:'FitTracker Pro',desc:'Fitness tracker AI',category:'Mobile',color:'#c8a8ae'},
        ]).map((p:any,i:number)=>(
          <div key={i} className="portfolio-card" style={{borderRadius:16,overflow:'hidden',border:'1px solid var(--glass-border)'}}>
            <div style={{height:160,background:`linear-gradient(135deg,${p.color}22,${p.color}44)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32}}><i className="fas fa-cubes" /></div>
            <div style={{padding:16}}><h3 style={{fontWeight:700}}>{p.title}</h3><p style={{fontSize:12,color:'var(--text-muted)'}}>{p.desc}</p></div>
          </div>
        ))}
      </div>
    </div>
  )
}
