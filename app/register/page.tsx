"use client"
import { useState } from "react"
import { api } from "@/lib/api"
import Link from "next/link"
import { Mascot } from "@/components/mascot/Mascot"

const inputStyle = { padding:'12px 16px', borderRadius:10, border:'1px solid var(--glass-border)', background:'var(--bg-3)', color:'var(--text)', width:'100%', boxSizing:'border-box' as const }
const inputWrapStyle = { display:'flex', flexDirection:'column' as const, gap:6 }

export default function RegisterPage() {
  const [step, setStep] = useState<'form'|'otp'>('form')
  const [form, setForm] = useState({ name:'', email:'', password:'', ref:'' })
  const [otp, setOtp] = useState('')
  const [msg, setMsg] = useState('')
  const [emailTaken, setEmailTaken] = useState(false)

  async function checkEmail(raw: string) {
    const email = raw.replace(/\s/g, '').toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailTaken(false); return }
    try {
      const d = await api(`/auth/check-email?email=${encodeURIComponent(email)}`, { cache:false })
      setEmailTaken(!!d.exists)
    } catch { setEmailTaken(false) }
  }

  async function submitForm(e:any) {
    e.preventDefault()
    setMsg('Loading...')
    if (emailTaken) { setMsg('Email sudah terdaftar. Gunakan email lain.'); return }
    try {
      const body:any = { name: form.name, email: form.email.replace(/\s/g,''), password: form.password }
      if (form.ref.trim()) body.ref_code = form.ref.trim().toUpperCase()
      await api("/auth/register", { method:"POST", body, cache:false })
      setMsg('Kode OTP dikirim ke email Anda.')
      setStep('otp')
    } catch(err:any) { setMsg(err.message || 'Registrasi gagal') }
  }

  async function submitOtp(e:any) {
    e.preventDefault()
    setMsg('Loading...')
    try {
      const res = await api("/auth/verify-otp", { method:"POST", body:{ email: form.email.replace(/\s/g,''), otp }, cache:false })
      setMsg('Registrasi berhasil! Redirect...')
      if(res.user?.role==='admin') window.location.href='/admin'
      else window.location.href='/profile'
    } catch(err:any) { setMsg(err.message || 'Kode OTP salah') }
  }

  async function resendOtp() {
    setMsg('Mengirim ulang...')
    try {
      await api("/auth/resend-otp", { method:"POST", body:{ email: form.email.replace(/\s/g,'') }, cache:false })
      setMsg('OTP dikirim ulang.')
    } catch(err:any) { setMsg(err.message || 'Gagal kirim ulang') }
  }

  return (
    <div style={{maxWidth:380,margin:'80px auto',padding:'32px 24px',background:'var(--bg-2)',borderRadius:16,border:'1px solid var(--glass-border)',position:'relative',overflow:'hidden'}}>
      <div style={{textAlign:'center',marginTop:-20}}>
        <Mascot src="/mascot/maskot-hore-semangat-lompat.png" size={130} alt="Hore" style={{margin:'0 auto'}} />
      </div>
      <h1 style={{fontSize:24,fontWeight:800,fontFamily:'Syne',textAlign:'center'}}>{step==='form' ? 'Buat Akun' : 'Verifikasi OTP'}</h1>
      <p style={{textAlign:'center',color:'var(--text-muted)',fontSize:13,marginTop:6}}>
        {step==='form' ? 'Daftar di BMS Platform' : 'Kode verifikasi telah dikirim ke email Anda.'}
      </p>

      {step==='form' && (
        <form onSubmit={submitForm} style={{marginTop:24,display:'flex',flexDirection:'column',gap:12}}>
          <div style={inputWrapStyle}>
            <input placeholder="Nama lengkap" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required style={inputStyle}/>
          </div>
          <div style={inputWrapStyle}>
            <input placeholder="Email" type="email" value={form.email} onChange={e=>{ setForm({...form,email:e.target.value}); checkEmail(e.target.value) }} required style={inputStyle}/>
            {emailTaken && <span style={{fontSize:11,color:'#cd8489'}}>Email sudah terdaftar. Gunakan email lain.</span>}
          </div>
          <div style={inputWrapStyle}>
            <input placeholder="Password (min 6 karakter)" type="password" minLength={6} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required style={inputStyle}/>
          </div>
          <div style={inputWrapStyle}>
            <input placeholder="Kode referral (opsional)" value={form.ref} onChange={e=>setForm({...form,ref:e.target.value})} style={{...inputStyle,textTransform:'uppercase' as const}}/>
          </div>
          <button type="submit" className="btn btn-primary">Register</button>
          {msg && <p style={{fontSize:12,color:'var(--text-muted)',textAlign:'center'}}>{msg}</p>}
        </form>
      )}

      {step==='otp' && (
        <form onSubmit={submitOtp} style={{marginTop:24,display:'flex',flexDirection:'column',gap:12}}>
          <input placeholder="Masukkan kode OTP" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value)} required style={inputStyle}/>
          <button type="submit" className="btn btn-primary">Verifikasi</button>
          <button type="button" className="btn btn-outline" onClick={resendOtp}>Kirim ulang OTP</button>
          {msg && <p style={{fontSize:12,color:'var(--text-muted)',textAlign:'center'}}>{msg}</p>}
        </form>
      )}

      <p style={{textAlign:'center',fontSize:12,marginTop:16,color:'var(--text-muted)'}}>
        Sudah punya akun? <Link href="/login" style={{color:'var(--primary)',textDecoration:'underline'}}>Login</Link>
      </p>
    </div>
  )
}