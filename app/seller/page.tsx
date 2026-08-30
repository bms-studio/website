"use client"
import { Mascot } from "@/components/mascot/Mascot"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useStore } from "@/lib/store"

export default function SellerPage(){
  const {isLoggedIn,user}=useStore()
  const [products,setProducts]=useState<any[]>([])
  const [form,setForm]=useState({name:'',price:'',description:'',image:'',category:'other'})
  const [msg,setMsg]=useState("")

  async function load(){
    try{
      const d=await api("/seller/my-products")
      setProducts(d.products||[])
    }catch(e:any){ setMsg(e.message)}
  }
  useEffect(()=>{ if(isLoggedIn) load()},[isLoggedIn])

  async function submit(e:any){
    e.preventDefault()
    try{
      await api("/seller/products",{method:"POST",body:form})
      setMsg("Produk diajukan! Menunggu approval +5 XP")
      setForm({name:'',price:'',description:'',image:'',category:'other'})
      load()
    }catch(e:any){ setMsg(e.message)}
  }
  async function del(id:number){
    if(!confirm("Hapus produk?")) return
    try{ await api(`/seller/products/${id}`,{method:"DELETE"}); load() }catch(e:any){ setMsg(e.message)}
  }

  if(!isLoggedIn) return <div style={{maxWidth:700,margin:'80px auto',padding:20,textAlign:'center'}}><h2>Login sebagai seller</h2><p style={{color:'var(--text-muted)'}}>Hanya user terverifikasi bisa jual. <a href="/login" style={{color:'var(--primary)'}}>Login</a></p></div>

  return (
    <div style={{maxWidth:1000,margin:'0 auto',padding:'80px 20px'}}>
      <div style={{display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}}>
        <Mascot src="/mascot/maskot-fokus-kerja-laptop.png" size={190} alt="Fokus" />
        <div style={{flex:'1 1 320px'}}>
          <h1 style={{fontSize:28,fontWeight:800,fontFamily:'Syne'}}>Seller <span style={{background:'var(--gradient-1)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Dashboard</span></h1>
          <p style={{color:'var(--text-muted)'}}>Kelola produk Public Store — {products.length} produk</p>
        </div>
      </div>

      <form onSubmit={submit} style={{marginTop:20,padding:16,border:'1px solid var(--glass-border)',borderRadius:16,background:'var(--glass)',display:'grid',gap:10}}>
        <h3 style={{fontWeight:700}}>Tambah Produk</h3>
        <input placeholder="Nama produk" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required style={{padding:'10px 14px',borderRadius:10,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}}/>
        <input placeholder="Harga (contoh: Rp 50.000 atau Gratis)" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} style={{padding:'10px 14px',borderRadius:10,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}}/>
        <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{padding:'10px 14px',borderRadius:10,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}}>
          <option value="other">Other</option><option value="web">Web</option><option value="roblox">Roblox</option><option value="design">Design</option>
        </select>
        <input placeholder="Image URL https://" value={form.image} onChange={e=>setForm({...form,image:e.target.value})} style={{padding:'10px 14px',borderRadius:10,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}}/>
        <textarea placeholder="Deskripsi" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={2} style={{padding:'10px 14px',borderRadius:10,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}}/>
        <button type="submit" className="btn btn-primary">Ajukan Produk</button>
        {msg && <p style={{fontSize:12,color:'var(--secondary)'}}>{msg}</p>}
      </form>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:14,marginTop:24}}>
        {products.map((p:any)=>(
          <div key={p.id} style={{padding:14,border:'1px solid var(--glass-border)',borderRadius:16,background:'var(--glass)'}}>
            <div style={{height:100,borderRadius:10,background:'var(--bg-3)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
              {p.image ? <img src={p.image} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <i className="fas fa-box" style={{color:'var(--text-dim)'}}/>}
            </div>
            <div style={{fontWeight:600,marginTop:8}}>{p.name}</div>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>{p.price} · {p.status} · {p.category}</div>
            <div style={{display:'flex',gap:6,marginTop:8}}>
              <button onClick={()=>del(p.id)} style={{flex:1,padding:'6px',borderRadius:8,border:'1px solid rgba(201,111,111,.2)',background:'rgba(201,111,111,.1)',color:'#c96f6f',cursor:'pointer'}}>Hapus</button>
            </div>
          </div>
        ))}
        {!products.length && <div style={{gridColumn:'1/-1',textAlign:'center',padding:'30px 20px'}}><Mascot src="/mascot/maskot-ngantuk-tidur-di-laptop.png" size={220} alt="Ngantuk" style={{margin:'0 auto 12px'}}/><p style={{color:'var(--text-muted)'}}>Belum ada produk. Tambah di atas — jangan ngantuk!</p></div>}
      </div>
    </div>
  )
}
