const services = [
  {icon:'fa-code',title:'Web Development',desc:'Website modern, cepat, dan SEO-friendly dengan Next.js & Tailwind.'},
  {icon:'fa-gamepad',title:'Roblox Game Dev',desc:'Game Roblox performa tinggi dengan sistem module lengkap.'},
  {icon:'fa-mobile-alt',title:'Mobile App',desc:'Aplikasi Android & iOS dengan Flutter/React Native.'},
  {icon:'fa-paint-brush',title:'UI/UX Design',desc:'Desain elegan dan fungsional untuk semua platform.'},
  {icon:'fa-robot',title:'Discord Bot',desc:'Bot all-in-one dengan 100+ commands.'},
  {icon:'fa-server',title:'Backend & API',desc:'API scalable dengan Node.js & database Turso.'},
]

import { Mascot } from "@/components/mascot/Mascot"
export default function ServicesPage() {
  return (
    <div style={{maxWidth:1200,margin:'0 auto',padding:'80px 20px'}}>
      <div style={{display:'flex',alignItems:'center',gap:24,flexWrap:'wrap'}}>
        <Mascot src="/mascot/maskot-cool-santai-minum.png" size={200} alt="Cool" />
        <div style={{flex:'1 1 320px'}}>
          <h1 style={{fontSize:36,fontWeight:800,fontFamily:'Syne'}}>Our <span style={{background:'var(--gradient-1)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Services</span></h1>
          <p style={{color:'var(--text-muted)',maxWidth:600,marginTop:8}}>11 layanan profesional untuk kebutuhan project Anda.</p>
        </div>
        <Mascot src="/mascot/maskot-cool-santai-minum.png" size={180} alt="Cool" />
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16,marginTop:32}}>
        {services.map(s=>(
          <div key={s.title} className="service-card" style={{padding:24,borderRadius:16}}>
            <div className="service-icon"><i className={`fas ${s.icon}`} /></div>
            <h3 style={{fontWeight:700}}>{s.title}</h3><p style={{fontSize:13,color:'var(--text-muted)',marginTop:6}}>{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
