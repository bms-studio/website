"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useStore } from "@/lib/store"
import { Mascot } from "@/components/mascot/Mascot"

export default function ChatPage(){
  const {isLoggedIn}=useStore()
  const [chats,setChats]=useState<any[]>([])
  const [text,setText]=useState("")
  const [loading,setLoading]=useState(true)

  async function load(){
    try{
      const d=await api("/public-chats")
      setChats(d.chats||[])
    }catch{} finally{ setLoading(false)}
  }
  useEffect(()=>{ load(); const iv=setInterval(load,3000); return()=>clearInterval(iv)},[])

  async function send(){
    if(!text.trim()) return
    if(!isLoggedIn){ window.location.href="/login"; return }
    try{ await api("/public-chats",{method:"POST",body:{text}}); setText(""); load() }catch(e:any){ alert(e.message)}
  }

  return (
    <div style={{maxWidth:700,margin:'0 auto',padding:'80px 20px'}}>
      <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
        <Mascot src="/mascot/maskot-hore-semangat-lompat.png" size={150} alt="Hore" />
        <h1 style={{fontSize:28,fontWeight:800,fontFamily:'Syne'}}>Community <span style={{background:'var(--gradient-1)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Chat</span></h1>
      </div>
      <div style={{marginTop:20,border:'1px solid var(--glass-border)',borderRadius:16,overflow:'hidden',background:'var(--bg-2)',height:420,display:'flex',flexDirection:'column'}}>
        <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:8}}>
          {loading? <p style={{textAlign:'center',color:'var(--text-muted)'}}>Loading...</p> : chats.map((c:any)=>(
            <div key={c.id} style={{display:'flex',gap:8,padding:8,borderRadius:12,background:'var(--glass)'}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:'var(--gradient-1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#fff',flexShrink:0}}>{(c.user_name||'?')[0]}</div>
              <div><div style={{fontSize:11,fontWeight:600}}>{c.user_name} <span style={{fontSize:9,padding:'1px 6px',borderRadius:4,background:'rgba(143,176,201,.12)',color:'#8fb0c9',marginLeft:6}}>{c.user_role}</span></div><div style={{fontSize:12,color:'var(--text-muted)'}}>{c.text}</div></div>
            </div>
          ))}
          {!loading && !chats.length && <p style={{textAlign:'center',color:'var(--text-muted)',fontSize:13}}>Belum ada pesan. Jadilah yang pertama!</p>}
        </div>
        <div style={{display:'flex',gap:8,padding:12,borderTop:'1px solid var(--glass-border)',background:'var(--bg-3)'}}>
          <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder={isLoggedIn?"Ketik pesan...":"Login untuk chat"} style={{flex:1,padding:'10px 16px',borderRadius:100,border:'1px solid var(--glass-border)',background:'var(--bg)',color:'var(--text)'}}/>
          <button onClick={send} style={{width:40,height:40,borderRadius:'50%',border:'none',background:'var(--gradient-1)',color:'#fff',cursor:'pointer'}}><i className="fas fa-paper-plane" /></button>
        </div>
      </div>
    </div>
  )
}
