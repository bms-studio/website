"use client"
import { useStore } from "@/lib/store"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Mascot } from "@/components/mascot/Mascot"

export default function ProfilePage(){
  const {user,isLoggedIn,loading,refreshAuth}=useStore()
  const [bio,setBio]=useState("")
  const [saving,setSaving]=useState(false)
  const [msg,setMsg]=useState("")

  useEffect(()=>{ if(user?.bio!==undefined) setBio(user.bio||"") },[user])

  async function save(){
    setSaving(true)
    try{
      await api("/admin/profile",{method:"PUT",body:{bio}})
      setMsg("Tersimpan!")
      refreshAuth()
    }catch(e:any){ setMsg(e.message)}
    setSaving(false)
  }

  if(loading) return <div style={{padding:80,textAlign:'center',color:'var(--text-muted)'}}>Loading...</div>
  if(!isLoggedIn) return <div style={{maxWidth:600,margin:'80px auto',padding:20,textAlign:'center'}}><h2 style={{fontWeight:800}}>Belum login</h2><p style={{color:'var(--text-muted)'}}>Silakan <a href="/login" style={{color:'var(--primary)'}}>login</a> untuk melihat profil.</p></div>

  return (
    <div style={{maxWidth:700,margin:'0 auto',padding:'80px 20px'}}>
      <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
        <Mascot src="/mascot/maskot-love-peluk-hati.png" size={150} alt="Love" />
        <div style={{display:'flex',gap:16,alignItems:'center'}}>
          <div style={{width:72,height:72,borderRadius:'50%',background:'var(--gradient-1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:800,color:'#fff',overflow:'hidden',flexShrink:0}}>
            {user?.avatar ? <img src={user.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : (user?.name||'U')[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{fontSize:22,fontWeight:800}}>{user?.name}</h1>
            <p style={{color:'var(--text-muted)',fontSize:13}}>{user?.email} · {user?.role}</p>
            <p style={{fontSize:12,marginTop:4}}>XP: {user?.xp||0}</p>
          </div>
        </div>
      </div>
      <div style={{marginTop:24,padding:16,border:'1px solid var(--glass-border)',borderRadius:16,background:'var(--glass)'}}>
        <label style={{fontSize:12,fontWeight:600}}>Bio</label>
        <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} placeholder="Ceritakan tentangmu..." style={{width:'100%',marginTop:8,padding:'12px 16px',borderRadius:10,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}}/>
        <button onClick={save} disabled={saving} className="btn btn-primary" style={{marginTop:12}}>{saving?'Menyimpan...':'Simpan'}</button>
        {msg && <p style={{marginTop:8,fontSize:12,color:'var(--secondary)'}}>{msg}</p>}
      </div>
    </div>
  )
}
