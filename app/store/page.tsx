"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useStore } from "@/lib/store"
import { ProductCard } from "@/components/product/ProductCard"
import { ProductModal } from "@/components/modals/ProductModal"

export default function StorePage() {
  const {wishlist,toggleWishlist,addToCart}=useStore()
  const [assets, setAssets] = useState<any[]>([])
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [storeType, setStoreType] = useState("store")

  useEffect(() => {
    api(`/assets?store_type=${storeType}`).then(d => setAssets(d.assets||[])).catch(()=>{})
  }, [storeType])

  const [selected,setSelected]=useState<any>(null)
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
            <ProductCard key={a.id} product={a} onDetail={setSelected} />
          ))}
          {!filtered.length && <div style={{gridColumn:'1/-1',textAlign:'center',padding:40,color:'var(--text-muted)'}}>Tidak ada produk</div>}
        </div>
      </div>
      {selected && <ProductModal product={selected} onClose={()=>setSelected(null)} onAddToCart={addToCart} />}
    </div>
  )
}
