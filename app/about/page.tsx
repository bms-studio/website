import { Mascot } from "@/components/mascot/Mascot"
export default function AboutPage() {
  return (
    <div style={{maxWidth:900,margin:'0 auto',padding:'80px 20px'}}>
      <div style={{display:'flex',alignItems:'center',gap:24,flexWrap:'wrap'}}>
        <Mascot src="/mascot/maskot-serius-lipat-tangan.png" size={200} alt="Serius" />
        <div style={{flex:'1 1 320px'}}>
          <h1 style={{fontSize:36,fontWeight:800,fontFamily:'Syne'}}>Tentang <span style={{background:'var(--gradient-1)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Kami</span></h1>
          <p style={{color:'var(--text-muted)',lineHeight:1.7,marginTop:16}}>
            BMS STUDIO adalah tim profesional yang berfokus pada pengembangan game Roblox, website, dan produk digital. Berdiri sejak 2020, kami telah menyelesaikan 150+ project dengan kepuasan 98%.
          </p>
        </div>
        <Mascot src="/mascot/maskot-serius-lipat-tangan.png" size={180} alt="Serius" />
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:16,marginTop:32}}>
        <div className="glass" style={{padding:20,borderRadius:16}}><h3 style={{fontWeight:700}}>Visi</h3><p style={{fontSize:13,color:'var(--text-muted)',marginTop:6}}>Menjadi studio digital terdepan yang menghasilkan karya berkualitas tinggi dan berdampak.</p></div>
        <div className="glass" style={{padding:20,borderRadius:16}}><h3 style={{fontWeight:700}}>Misi</h3><p style={{fontSize:13,color:'var(--text-muted)',marginTop:6}}>Memberikan solusi digital yang cepat, indah, dan fungsional untuk setiap klien.</p></div>
        <div className="glass" style={{padding:20,borderRadius:16}}><h3 style={{fontWeight:700}}>Tim</h3><p style={{fontSize:13,color:'var(--text-muted)',marginTop:6}}>50+ profesional: developer, designer, 3D artist, dan consultant.</p></div>
      </div>
    </div>
  )
}
