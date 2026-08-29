"use client"
import { useState } from "react"
import { api } from "@/lib/api"
import Link from "next/link"
import { Mascot } from "@/components/mascot/Mascot"

export default function LoginPage() {
  const [form,setForm]=useState({email:'',password:''})
  const [msg,setMsg]=useState('')
  async function submit(e:any){
    e.preventDefault()
    setMsg('Loading...')
    try{
      const res = await api("/auth/login",{method:"POST",body:form})
      setMsg('Login berhasil! Redirect...')
      if(res.user?.role==='admin') window.location.href='/admin'
      else window.location.href='/profile'
    }catch(err:any){ setMsg(err.message)}
  }
  return (
    <div style={{maxWidth:380,margin:'80px auto',padding:'32px 24px',background:'var(--bg-2)',borderRadius:16,border:'1px solid var(--glass-border)',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',right:-10,top:-10,opacity:0.9}}>
        <Mascot src="/mascot/maskot-hi-menyapa-waving.png" size={200} alt="Hi" />
      </div>
      <h1 style={{fontSize:24,fontWeight:800,fontFamily:'Syne',textAlign:'center'}}>Welcome Back</h1>
      <p style={{textAlign:'center',color:'var(--text-muted)',fontSize:13,marginTop:6}}>Login ke BMS Platform</p>
      <form onSubmit={submit} style={{marginTop:24,display:'flex',flexDirection:'column',gap:12}}>
        <input placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required style={{padding:'12px 16px',borderRadius:10,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}}/>
        <input placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required style={{padding:'12px 16px',borderRadius:10,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}}/>
        <button type="submit" className="btn btn-primary">Sign In</button>
        {msg && <p style={{fontSize:12,color:'var(--text-muted)',textAlign:'center'}}>{msg}</p>}
      </form>
      <p style={{textAlign:'center',fontSize:12,marginTop:16,color:'var(--text-muted)'}}>Belum punya akun? <Link href="/login" style={{color:'var(--primary)',textDecoration:'underline'}}>Daftar di SPA lama</Link> (register migrasi soon)</p>
    </div>
  )
}
