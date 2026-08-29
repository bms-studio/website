"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useStore } from "@/lib/store"
import Link from "next/link"

export default function StorePage() {
  const {wishlist,toggleWishlist,addToCart}=useStore()
  const [assets, setAssets] = useState<any[]>([])
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [storeType, setStoreType] = useState("store")

  useEffect(() => {
    api(`/assets?store_type=${storeType}`).then(d => setAssets(d.assets||[])).catch(()=>{})
  }, [storeType])

  const filtered = assets.filter(a => {
    const catOk = filter==="all" || a.category===filter
    const searchOk = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase())
    return catOk && searchOk
  })

  return (
    <div>
      <div style={{position:'relative',padding:'60px 20px',textAlign:'center',borderBottom:'1px solid var(--glass-border)',overflow:'hidden',background:'var(--bg-2)'}}>
        <h1 style={{fontSize:30,fontWeight:800,fontFamily:'Syne'}}>BMS <span style={{background:'var(--gradient-1)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>STORE</span></h1>
        <p style={{color:'var(--text-muted)',maxWidth:460,margin:'0 auto'}}>Produk digital dan tools pengembangan Roblox.</p>
        <div style={{display:'flex',gap:4,justifyContent:'center',marginTop:24,background:'var(--bg-3)',padding:4,borderRadius:10,maxWidth:320,marginLeft:'auto',marginRight:'auto'}}>
          <button onClick={()=>setStoreType('store')} style={{flex:1,padding:'8px 20px',borderRadius:8,border:'none',background:storeType==='store'?'var(--bg)':'transparent',color:storeType==='store'?'var(--text)':'var(--text-muted)',cursor:'pointer',fontWeight:600}}>BMS STORE</button>
          <button onClick={()=>setStoreType('studio')} style={{flex:1,padding:'8px 20px',borderRadius:8,border:'none',background:storeType==='studio'?'var(--bg)':'transparent',color:storeType==='studio'?'var(--text)':'var(--text-muted)',cursor:'pointer',fontWeight:600}}>BMS STUDIO</button>
        </div>
        <div style={{display:'flex',gap:6,justifyContent:'center',marginTop:20,flexWrap:'wrap'}}>
          {["all","web","roblox","design","other"].map(c=>(
            <button key={c} onClick={()=>setFilter(c)} style={{padding:'6px 16px',borderRadius:100,border:'1px solid var(--glass-border)',background:filter===c?'rgba(230,227,220,.1)':'var(--glass)',color:filter===c?'var(--primary)':'var(--text-muted)',cursor:'pointer'}}>{c}</button>
          ))}
        </div>
        <div style={{maxWidth:420,margin:'16px auto 0'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari produk..." style={{width:'100%',padding:'12px 16px',borderRadius:10,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}} />
        </div>
      </div>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'28px 20px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
          {filtered.map(a=>(
            <div key={a.id} className="asset-card" style={{borderRadius:16,overflow:'hidden',background:'linear-gradient(135deg,rgba(230,227,220,.05),rgba(150,172,159,.02))',border:'1px solid rgba(255,255,255,.06)',padding:0}}>
              <div style={{height:160,background:'var(--bg-4)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                {a.image ? <img src={a.image} alt={a.name} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy" /> : <i className="fas fa-cube" style={{fontSize:36,color:'var(--text-dim)'}} />}
              </div>
              <div style={{padding:16}}>
                <h3 style={{fontSize:14,fontWeight:700}}>{a.name}</h3>
                <p style={{fontSize:12,color:'var(--text-muted)',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{a.description}</p>
                <div style={{display:'flex',gap:6,alignItems:'center',marginTop:10}}>
                  <span style={{fontWeight:700,background:'var(--gradient-1)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',flex:1}}>{a.price}</span>
                  <button onClick={()=>toggleWishlist(a.id)} style={{width:32,height:32,borderRadius:'50%',border:'1px solid var(--glass-border)',background:wishlist.includes(a.id)?'rgba(200,168,174,.15)':'var(--glass)',color:wishlist.includes(a.id)?'#c8a8ae':'var(--text)',cursor:'pointer'}}><i className={wishlist.includes(a.id)?"fas fa-heart":"far fa-heart"} style={{fontSize:12}} /></button>
                  <button onClick={()=>{navigator.clipboard.writeText(`${location.origin}/store?product=${a.id}`); alert('Link disalin!')}} style={{width:32,height:32,borderRadius:'50%',border:'1px solid var(--glass-border)',background:'var(--glass)',cursor:'pointer'}}><i className="fas fa-link" style={{fontSize:11}} /></button>
                  <button onClick={()=>addToCart(a)} style={{padding:'6px 14px',borderRadius:100,border:'none',background:'var(--gradient-1)',color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600}}>Cart</button>
                </div>
              </div>
            </div>
          ))}
          {!filtered.length && <div style={{gridColumn:'1/-1',textAlign:'center',padding:40,color:'var(--text-muted)'}}>Tidak ada produk</div>}
        </div>
      </div>
    </div>
  )
}
