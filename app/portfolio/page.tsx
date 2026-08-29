"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useStore } from "@/lib/store"

export default function PortfolioPage() {
  const {user}=useStore()
  const isAdmin = user?.role==="admin"
  const [items, setItems] = useState<any[]>([])
  const [form,setForm]=useState({title:'',desc:'',category:'Web',color:'#e6e3dc',image:'',tags:''})
  const [msg,setMsg]=useState("")
  async function load(){ try{ const d=await api("/portfolio"); setItems(d.portfolio||d.items||[]) }catch{} }
  useEffect(()=>{ load() },[])
  async function add(e:any){
    e.preventDefault()
    try{ await api("/portfolio",{method:"POST",body:form}); setForm({title:'',desc:'',category:'Web',color:'#e6e3dc',image:'',tags:''}); setMsg("Ditambah!"); load() }catch(err:any){ setMsg(err.message)}
  }
  return (
    <div style={{maxWidth:1200,margin:'0 auto',padding:'80px 20px'}}>
      <h1 style={{fontSize:36,fontWeight:800,fontFamily:'Syne'}}>Our <span style={{background:'var(--gradient-1)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Portfolio</span></h1>
      <p style={{color:'var(--text-muted)',marginTop:8}}>Beberapa project yang telah kami kerjakan.</p>
      {isAdmin && (
        <form onSubmit={add} style={{marginTop:20,padding:16,border:'1px solid var(--glass-border)',borderRadius:16,background:'var(--glass)',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:8}}>
          <input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required style={{padding:'10px 12px',borderRadius:8,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}}/>
          <input placeholder="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{padding:'10px 12px',borderRadius:8,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}}/>
          <input placeholder="Image URL" value={form.image} onChange={e=>setForm({...form,image:e.target.value})} style={{padding:'10px 12px',borderRadius:8,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}}/>
          <input placeholder="Tags comma" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} style={{padding:'10px 12px',borderRadius:8,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}}/>
          <textarea placeholder="Desc" value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} style={{gridColumn:'1/-1',padding:'10px 12px',borderRadius:8,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}} rows={2}/>
          <button type="submit" className="btn btn-primary" style={{gridColumn:'1/-1'}}>Tambah Portfolio</button>
          {msg && <p style={{gridColumn:'1/-1',fontSize:12,color:'var(--secondary)'}}>{msg}</p>}
        </form>
      )}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16,marginTop:24}}>
        {(items.length?items:[
          {title:'E-Commerce Platform',desc:'Full-stack dengan payment gateway',category:'Web',color:'#e6e3dc'},
          {title:'Adventure Quest RPG',desc:'Roblox open-world',category:'Roblox',color:'#93ab9e'},
          {title:'FitTracker Pro',desc:'Fitness tracker AI',category:'Mobile',color:'#c8a8ae'},
        ]).map((p:any,i:number)=>(
          <div key={p.id||i} className="portfolio-card" style={{borderRadius:16,overflow:'hidden',border:'1px solid var(--glass-border)',background:'var(--glass)'}}>
            <div style={{height:160,background:p.image?`url(${p.image}) center/cover`:`linear-gradient(135deg,${p.color||'#e6e3dc'}22,${p.color||'#e6e3dc'}44)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32}}>{!p.image && <i className="fas fa-cubes" />}</div>
            <div style={{padding:16}}><h3 style={{fontWeight:700}}>{p.title}</h3><p style={{fontSize:12,color:'var(--text-muted)'}}>{p.desc}</p><div style={{marginTop:8,display:'flex',gap:6,flexWrap:'wrap'}}>{String(p.tags||'').split(',').filter(Boolean).slice(0,3).map((t:string)=><span key={t} style={{fontSize:9,padding:'2px 8px',borderRadius:100,background:'var(--bg-3)',color:'var(--text-muted)'}}>{t.trim()}</span>)}</div>
              {isAdmin && <button onClick={async()=>{ if(!confirm('Hapus?'))return; try{ await api(`/portfolio/${p.id}`,{method:'DELETE'}); load()}catch{}}} style={{marginTop:10,padding:'6px 12px',borderRadius:8,border:'1px solid rgba(201,111,111,.2)',background:'rgba(201,111,111,.1)',color:'#c96f6f',cursor:'pointer',fontSize:11}}>Hapus</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
