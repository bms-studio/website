"use client"
import Image from "next/image"
import { useStore } from "@/lib/store"

export function ProductCard({ product, onDetail }: { product: any, onDetail?: (p:any)=>void }) {
  const { wishlist, toggleWishlist, addToCart } = useStore()
  const isWish = wishlist.includes(product.id)
  const price = product.price || "Gratis"
  const isFree = price === "Gratis"

  return (
    <div className="asset-card" style={{borderRadius:16,overflow:'hidden',background:'linear-gradient(135deg,rgba(230,227,220,.05),rgba(150,172,159,.02))',border:'1px solid rgba(255,255,255,.06)'}}>
      <div style={{height:160,background:'var(--bg-4)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',cursor:'pointer'}} onClick={()=>onDetail?.(product)}>
        {product.image ? <Image src={product.image} alt={product.name} width={300} height={160} style={{width:'100%',height:'100%',objectFit:'cover'}} unoptimized /> : <i className="fas fa-cube" style={{fontSize:32,color:'var(--text-dim)'}}/>}
      </div>
      <div style={{padding:14}}>
        <h3 style={{fontSize:14,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{product.name}</h3>
        <div style={{fontSize:11,color:'var(--text-muted)',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',minHeight:32}}>{product.description||""}</div>
        <div style={{display:'flex',gap:6,marginTop:10,alignItems:'center'}}>
          <span style={{flex:1,fontWeight:700,background:'var(--gradient-1)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{isFree?'Gratis':price}</span>
          <button onClick={()=>toggleWishlist(product.id)} title="Wishlist" style={{width:32,height:32,borderRadius:'50%',border:'1px solid var(--glass-border)',background:isWish?'rgba(200,168,174,.15)':'var(--glass)',color:isWish?'#c8a8ae':'var(--text)',cursor:'pointer'}}><i className={isWish?"fas fa-heart":"far fa-heart"} /></button>
          <button onClick={()=>{navigator.clipboard.writeText(`${location.origin}/store?product=${product.id}`)}} title="Share" style={{width:32,height:32,borderRadius:'50%',border:'1px solid var(--glass-border)',background:'var(--glass)',cursor:'pointer'}}><i className="fas fa-link" style={{fontSize:11}} /></button>
          <button onClick={()=>addToCart(product)} style={{padding:'6px 14px',borderRadius:100,border:'none',background:'var(--gradient-1)',color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600}}>Cart</button>
        </div>
      </div>
    </div>
  )
}
