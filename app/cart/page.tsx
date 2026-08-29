"use client"
import { Mascot } from "@/components/mascot/Mascot"
import { useStore } from "@/lib/store"
import { api } from "@/lib/api"
import { useState } from "react"

export default function CartPage(){
  const {cart,removeFromCart,isLoggedIn}=useStore()
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState("")
  const total = cart.reduce((s,i)=> s + (parseFloat(String(i.price).replace(/[^0-9.]/g,""))||0)*(i.qty||1),0)

  async function checkout(){
    if(!isLoggedIn) { window.location.href="/login"; return }
    if(!cart.length) return
    setLoading(true)
    try{
      const res = await api("/orders",{method:"POST",body:{items:cart,total}})
      setMsg("Order berhasil! ID: "+res.order?.id)
      localStorage.removeItem("bms_cart")
      location.reload()
    }catch(e:any){ setMsg(e.message) }
    setLoading(false)
  }

  return (
    <div style={{maxWidth:800,margin:'0 auto',padding:'80px 20px'}}>
      <h1 style={{fontSize:28,fontWeight:800,fontFamily:'Syne'}}>Keranjang</h1>
      {!cart.length ? (
        <div style={{textAlign:'center',padding:'40px 20px'}}>
          <Mascot src="/mascot/maskot-happy-belanja-bawa-tas.png" size={240} alt="Happy" style={{margin:'0 auto 16px'}}/>
          <h2 style={{fontWeight:800,fontSize:22}}>Keranjang kosong</h2>
          <p style={{color:'var(--text-muted)',marginTop:8}}>Belum ada produk. Yuk belanja di Store!</p>
          <a href="/store" className="btn btn-primary" style={{marginTop:16,display:'inline-flex'}}>Ke Store →</a>
        </div>
      ) : (
        <>
          <div style={{display:'flex',flexDirection:'column',gap:12,marginTop:20}}>
            {cart.map((item:any)=>(
              <div key={item.id} style={{display:'flex',gap:12,padding:14,border:'1px solid var(--glass-border)',borderRadius:16,background:'var(--glass)',alignItems:'center'}}>
                <div style={{width:56,height:56,borderRadius:10,background:'var(--bg-3)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
                  {item.image ? <img src={item.image} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <i className="fas fa-cube" />}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600}}>{item.name}</div>
                  <div style={{fontSize:12,color:'var(--text-muted)'}}>{item.price} × {item.qty}</div>
                </div>
                <button onClick={()=>removeFromCart(item.id)} style={{padding:'6px 10px',borderRadius:8,border:'1px solid var(--glass-border)',background:'transparent',cursor:'pointer'}}>Hapus</button>
              </div>
            ))}
          </div>
          <div style={{marginTop:20,padding:16,border:'1px solid var(--glass-border)',borderRadius:16,background:'var(--bg-2)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><div style={{fontSize:12,color:'var(--text-muted)'}}>Total</div><div style={{fontSize:20,fontWeight:800}}>{total ? `Rp ${total.toLocaleString('id-ID')}` : 'Gratis'}</div></div>
            <button onClick={checkout} disabled={loading} className="btn btn-primary">{loading?'Proses...':'Checkout'}</button>
          </div>
          {msg && <p style={{marginTop:12,fontSize:13,color:'var(--secondary)'}}>{msg}</p>}
          {!isLoggedIn && <p style={{marginTop:12,fontSize:12,color:'var(--text-muted)'}}>Login diperlukan untuk checkout. <a href="/login" style={{color:'var(--primary)'}}>Login</a></p>}
        </>
      )}
    </div>
  )
}
