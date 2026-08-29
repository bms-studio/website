"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

type Tab = "assets"|"users"|"orders"|"messages"

export default function AdminPage(){
  const [tab,setTab]=useState<Tab>("assets")
  const [assets,setAssets]=useState<any[]>([])
  const [users,setUsers]=useState<any[]>([])
  const [orders,setOrders]=useState<any[]>([])
  const [messages,setMessages]=useState<any[]>([])
  const [msg,setMsg]=useState("")

  async function loadAssets(){ try{ const d=await api("/assets"); setAssets(d.assets||[]) }catch{} }
  async function loadUsers(){ try{ const d=await api("/admin/users"); setUsers(d.users||[]) }catch(e:any){ setMsg(e.message)} }
  async function loadOrders(){ try{ const d=await api("/orders/all"); setOrders(d.orders||[]) }catch{} }
  async function loadMessages(){ try{ const d=await api("/messages"); setMessages(d.messages||[]) }catch{} }

  useEffect(()=>{
    if(tab==="assets") loadAssets()
    if(tab==="users") loadUsers()
    if(tab==="orders") loadOrders()
    if(tab==="messages") loadMessages()
  },[tab])

  useEffect(()=>{ loadAssets() },[])

  return (
    <div style={{maxWidth:1200,margin:'0 auto',padding:'80px 20px'}}>
      <h1 style={{fontSize:28,fontWeight:800,fontFamily:'Syne'}}>Admin <span style={{background:'var(--gradient-1)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Panel</span></h1>
      <p style={{color:'var(--text-muted)'}}>Kelola BMS Platform — proteksi server aktif.</p>

      <div style={{display:'flex',gap:8,marginTop:16,flexWrap:'wrap'}}>
        {(["assets","users","orders","messages"] as Tab[]).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:'8px 16px',borderRadius:100,border:'1px solid var(--glass-border)',background:tab===t?'var(--primary)':'var(--glass)',color:tab===t?'#000':'var(--text-muted)',cursor:'pointer',fontWeight:600,textTransform:'capitalize'}}>{t}</button>
        ))}
      </div>

      <div style={{marginTop:20}}>
        {tab==="assets" && (
          <div>
            <h3 style={{fontWeight:700}}>Assets ({assets.length})</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12,marginTop:12}}>
              {assets.map((a:any)=>(
                <div key={a.id} style={{padding:12,border:'1px solid var(--glass-border)',borderRadius:12,background:'var(--glass)'}}>
                  <div style={{fontWeight:600,fontSize:13}}>{a.name}</div>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>{a.store_type} · {a.category} · {a.price}</div>
                  <div style={{display:'flex',gap:6,marginTop:8}}>
                    <button onClick={async()=>{ if(!confirm('Hapus?'))return; try{ await api(`/assets/${a.id}`,{method:'DELETE'}); loadAssets()}catch(e:any){setMsg(e.message)}}} style={{flex:1,padding:'6px',borderRadius:8,border:'1px solid rgba(201,111,111,.2)',background:'rgba(201,111,111,.1)',color:'#c96f6f',cursor:'pointer'}}>Hapus</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab==="users" && (
          <div>
            <h3 style={{fontWeight:700}}>Users ({users.length})</h3>
            <div style={{overflowX:'auto',marginTop:12,border:'1px solid var(--glass-border)',borderRadius:12}}>
              <table style={{width:'100%',fontSize:12,borderCollapse:'collapse'}}>
                <thead><tr style={{background:'var(--bg-3)',textAlign:'left'}}><th style={{padding:10}}>ID</th><th style={{padding:10}}>Name</th><th style={{padding:10}}>Email</th><th style={{padding:10}}>Role</th></tr></thead>
                <tbody>{users.map((u:any)=><tr key={u.id} style={{borderTop:'1px solid var(--glass-border)'}}><td style={{padding:10}}>{u.id}</td><td style={{padding:10}}>{u.name}</td><td style={{padding:10}}>{u.email}</td><td style={{padding:10}}>{u.role}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}
        {tab==="orders" && (
          <div>
            <h3 style={{fontWeight:700}}>Orders ({orders.length})</h3>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:12}}>
              {orders.map((o:any)=>(
                <div key={o.id} style={{padding:12,border:'1px solid var(--glass-border)',borderRadius:12,background:'var(--glass)',display:'flex',justifyContent:'space-between'}}>
                  <div><div style={{fontWeight:600}}>#{o.id} — {o.customer_name||'Guest'}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>{o.customer_email} · {o.store_type} · Rp {o.total}</div></div>
                  <span style={{padding:'4px 10px',borderRadius:100,background:'rgba(150,172,159,.12)',fontSize:11}}>{o.status}</span>
                </div>
              ))}
              {!orders.length && <p style={{color:'var(--text-muted)',textAlign:'center',padding:20}}>Belum ada order</p>}
            </div>
          </div>
        )}
        {tab==="messages" && (
          <div>
            <h3 style={{fontWeight:700}}>Messages ({messages.length})</h3>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:12}}>
              {messages.map((m:any)=>(
                <div key={m.id} style={{padding:12,border:'1px solid var(--glass-border)',borderRadius:12,background:'var(--glass)'}}>
                  <div style={{fontWeight:600}}>{m.name} <span style={{fontWeight:400,color:'var(--text-muted)',fontSize:11}}>— {m.email}</span></div>
                  <p style={{fontSize:12,marginTop:4,color:'var(--text-muted)'}}>{m.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {msg && <p style={{marginTop:12,fontSize:12,color:'#c96f6f'}}>{msg}</p>}
      </div>
    </div>
  )
}
