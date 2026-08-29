"use client"
import { useState } from "react"
import { api } from "@/lib/api"
import { Mascot } from "@/components/mascot/Mascot"

export default function ContactPage() {
  const [form,setForm]=useState({name:'',email:'',message:''})
  const [sent,setSent]=useState(false)
  async function submit(e:any){
    e.preventDefault()
    try{ await api("/messages",{method:"POST",body:form}); setSent(true); setForm({name:'',email:'',message:''}) }catch(err:any){ alert(err.message)}
  }
  return (
    <div style={{maxWidth:700,margin:'0 auto',padding:'80px 20px',position:'relative'}}>
      <div style={{position:'absolute',right:10,top:10,opacity:0.9}} className="mascot-hide-mobile">
        <Mascot src="/mascot/maskot-bingung-bertanya.png" size={200} alt="Bingung" />
      </div>
      <h1 style={{fontSize:36,fontWeight:800,fontFamily:'Syne'}}>Contact <span style={{background:'var(--gradient-1)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Us</span></h1>
      <p style={{color:'var(--text-muted)',marginTop:8}}>Konsultasi gratis — tim kami siap membantu.</p>
      <form onSubmit={submit} style={{marginTop:24,display:'flex',flexDirection:'column',gap:12}}>
        <input placeholder="Nama" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required style={{padding:'12px 16px',borderRadius:10,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}}/>
        <input placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required style={{padding:'12px 16px',borderRadius:10,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}}/>
        <textarea placeholder="Pesan" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} required rows={4} style={{padding:'12px 16px',borderRadius:10,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}}/>
        <button type="submit" className="btn btn-primary">Kirim Pesan</button>
        {sent && <p style={{color:'var(--secondary)',fontSize:13}}>Pesan terkirim! Kami akan balas segera.</p>}
      </form>
    </div>
  )
}
