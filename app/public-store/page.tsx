'use client'
import { Mascot } from '@/components/mascot/Mascot'
import {useEffect,useState} from 'react'
import {api} from '@/lib/api'
export default function PublicStorePage(){
  const [items,setItems]=useState<any[]>([])
  useEffect(()=>{ api('/seller/products').then(d=>setItems(d.products||[])).catch(()=>{}) },[])
  return (
    <div style={{maxWidth:1200,margin:'0 auto',padding:'80px 20px',position:'relative'}}>
      <div style={{position:'absolute',right:20,top:20,opacity:0.9}} className="mascot-hide-mobile">
        <Mascot src="/mascot/maskot-happy-belanja-bawa-tas.png" size={120} alt="Happy" />
      </div>
      <h1 style={{fontSize:28,fontWeight:800,fontFamily:'Syne'}}>Public <span style={{background:'var(--gradient-1)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Store</span></h1>
      <p style={{color:'var(--text-muted)'}}>Produk dari seller community — {items.length} items.</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:16,marginTop:24}}>
        {items.map((p:any)=><div key={p.id} style={{padding:16,border:'1px solid var(--glass-border)',borderRadius:16,background:'var(--glass)'}}><h3 style={{fontWeight:700}}>{p.name}</h3><p style={{fontSize:12,color:'var(--text-muted)'}}>{p.price}</p></div>)}
      </div>
    </div>
  )
}
