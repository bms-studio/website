"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Mascot } from "@/components/mascot/Mascot"

type Tab = "assets"|"users"|"orders"|"messages"|"promos"|"sellerapps"

export default function AdminPage(){
  const [tab,setTab]=useState<Tab>("assets")
  const [assets,setAssets]=useState<any[]>([])
  const [users,setUsers]=useState<any[]>([])
  const [orders,setOrders]=useState<any[]>([])
  const [messages,setMessages]=useState<any[]>([])
  const [promos,setPromos]=useState<any[]>([])
  const [apps,setApps]=useState<any[]>([])
  const [msg,setMsg]=useState("")
  const [newAsset,setNewAsset]=useState({name:'',price:'',category:'other',store_type:'store',image:'',description:''})

  async function loadAssets(){ try{ const d=await api("/assets"); setAssets(d.assets||[]) }catch{} }
  async function loadUsers(){ try{ const d=await api("/admin/users"); setUsers(d.users||[]) }catch(e:any){ setMsg(e.message)} }
  async function loadOrders(){ try{ const d=await api("/orders/all"); setOrders(d.orders||[]) }catch{} }
  async function loadMessages(){ try{ const d=await api("/messages"); setMessages(d.messages||[]) }catch{} }
  async function loadPromos(){ try{ const d=await api("/promos"); setPromos(d.promos||[]) }catch{} }
  async function loadApps(){ try{ const d=await api("/seller/applications"); setApps(d.applications||[])}catch{} }

  useEffect(()=>{
    if(tab==="assets") loadAssets()
    if(tab==="users") loadUsers()
    if(tab==="orders") loadOrders()
    if(tab==="messages") loadMessages()
    if(tab==="promos") loadPromos()
    if(tab==="sellerapps") loadApps()
  },[tab])

  useEffect(()=>{ loadAssets() },[])

  return (
    <div style={{maxWidth:1200,margin:'0 auto',padding:'80px 20px'}}>
      <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
        <Mascot src="/mascot/maskot-fokus-kerja-laptop.png" size={160} alt="Fokus" />
        <div>
          <h1 style={{fontSize:28,fontWeight:800,fontFamily:'Syne'}}>Admin <span style={{background:'var(--gradient-1)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Panel</span></h1>
          <p style={{color:'var(--text-muted)'}}>Kelola BMS Platform — proteksi server aktif.</p>
        </div>
      </div>

      <div style={{display:'flex',gap:8,marginTop:16,flexWrap:'wrap'}}>
        {(["assets","users","orders","messages","promos","sellerapps"] as Tab[]).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:'8px 16px',borderRadius:100,border:'1px solid var(--glass-border)',background:tab===t?'var(--primary)':'var(--glass)',color:tab===t?'#000':'var(--text-muted)',cursor:'pointer',fontWeight:600,textTransform:'capitalize'}}>{t.replace('sellerapps','seller apps')}</button>
        ))}
      </div>

      <div style={{marginTop:20}}>
        {tab==="assets" && (
          <div>
            <h3 style={{fontWeight:700}}>Assets ({assets.length})</h3>
            <form onSubmit={async(e)=>{e.preventDefault(); try{ await api("/assets",{method:"POST",body:newAsset}); setNewAsset({name:'',price:'',category:'other',store_type:'store',image:'',description:''}); loadAssets(); setMsg("Asset ditambah!")}catch(err:any){setMsg(err.message)}}} style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:8,marginTop:12,padding:12,border:'1px solid var(--glass-border)',borderRadius:12,background:'var(--glass)'}}>
              <input placeholder="Nama" value={newAsset.name} onChange={e=>setNewAsset({...newAsset,name:e.target.value})} required style={{padding:'8px 12px',borderRadius:8,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}}/>
              <input placeholder="Harga" value={newAsset.price} onChange={e=>setNewAsset({...newAsset,price:e.target.value})} style={{padding:'8px 12px',borderRadius:8,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}}/>
              <input placeholder="Image URL" value={newAsset.image} onChange={e=>setNewAsset({...newAsset,image:e.target.value})} style={{padding:'8px 12px',borderRadius:8,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}}/>
              <select value={newAsset.category} onChange={e=>setNewAsset({...newAsset,category:e.target.value})} style={{padding:'8px 12px',borderRadius:8,border:'1px solid var(--glass-border)',background:'var(--bg-3)',color:'var(--text)'}}><option value="other">Other</option><option value="web">Web</option><option value="roblox">Roblox</option></select>
              <button type="submit" style={{padding:'8px 16px',borderRadius:8,border:'none',background:'var(--gradient-1)',color:'#fff',cursor:'pointer',fontWeight:600}}>Tambah</button>
            </form>
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
        {tab==="promos" && (
          <div>
            <h3 style={{fontWeight:700}}>Promos ({promos.length})</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12,marginTop:12}}>
              {promos.map((p:any)=>(
                <div key={p.id} style={{padding:12,border:'1px solid var(--glass-border)',borderRadius:12,background:'var(--glass)',textAlign:'center'}}>
                  <div style={{fontWeight:700,fontFamily:'monospace'}}>{p.code}</div>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>{p.discount}% off — {p.used_count}/{p.max_uses||'∞'} used</div>
                  <span style={{display:'inline-block',marginTop:6,padding:'2px 8px',borderRadius:100,background:p.active?'rgba(150,172,159,.15)':'rgba(201,111,111,.12)',color:p.active?'#93ab9e':'#c96f6f',fontSize:10}}>{p.active?'Active':'Inactive'}</span>
                </div>
              ))}
              {!promos.length && <p style={{gridColumn:'1/-1',textAlign:'center',color:'var(--text-muted)',padding:20}}>Belum ada promo</p>}
            </div>
          </div>
        )}
        {tab==="sellerapps" && (
          <div>
            <h3 style={{fontWeight:700}}>Seller Applications ({apps.length})</h3>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:12}}>
              {apps.map((a:any)=>(
                <div key={a.id} style={{padding:12,border:'1px solid var(--glass-border)',borderRadius:12,background:'var(--glass)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div><div style={{fontWeight:600}}>{a.name} — {a.email}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>{a.reason?.slice(0,80)}</div><span style={{fontSize:10,padding:'2px 8px',borderRadius:100,background:a.status==='pending'?'rgba(201,173,114,.12)':'rgba(150,172,159,.12)'}}>{a.status}</span></div>
                  {a.status==='pending' && <div style={{display:'flex',gap:6}}><button onClick={async()=>{ await api(`/admin/seller-apps/${a.id}`,{method:'PUT',body:{status:'approved'}}); loadApps()}} style={{padding:'6px 12px',borderRadius:8,border:'none',background:'rgba(150,172,159,.15)',color:'#93ab9e',cursor:'pointer'}}>Approve</button><button onClick={async()=>{ await api(`/admin/seller-apps/${a.id}`,{method:'PUT',body:{status:'rejected'}}); loadApps()}} style={{padding:'6px 12px',borderRadius:8,border:'none',background:'rgba(201,111,111,.12)',color:'#c96f6f',cursor:'pointer'}}>Reject</button></div>}
                </div>
              ))}
              {!apps.length && <p style={{textAlign:'center',color:'var(--text-muted)',padding:20}}>Tidak ada aplikasi</p>}
            </div>
          </div>
        )}
        {msg && <p style={{marginTop:12,fontSize:12,color:'#c96f6f'}}>{msg}</p>}
      </div>
    </div>
  )
}
