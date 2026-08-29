"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import { Mascot } from "@/components/mascot/Mascot"

export default function HomePage() {
  const [services, setServices] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [testimonials, setTestimonials] = useState<any[]>([])

  useEffect(() => {
    api("/assets").then(d => setServices((d.assets||[]).slice(0,3))).catch(()=>{})
    api("/seller/products").then(d => setProducts((d.products||[]).slice(0,4))).catch(()=>{})
    api("/testimonials").then(d => setTestimonials((d.testimonials||[]).slice(0,3))).catch(()=>{})
  }, [])

  return (
    <div>
      <section className="hero" style={{position:'relative',overflow:'hidden'}}>
        <div className="hero-grid" />
        <div className="orb orb-1" /><div className="orb orb-2" />
        <div className="floating-shape s1" /><div className="floating-shape s2" /><div className="floating-shape s3" />
        <div className="particles"><div className="particle" /><div className="particle" /><div className="particle" /><div className="particle" /><div className="particle" /><div className="particle" /><div className="particle" /><div className="particle" /></div>
        <canvas id="threeCanvas" />
        <div style={{position:'absolute',right:'4%',bottom:'6%',zIndex:2}} className="mascot-hide-mobile">
          <Mascot src="/mascot/maskot-hi-menyapa-waving.png" size={260} alt="Hi" />
        </div>
        <div className="hero-content" style={{position:'relative',zIndex:3}}>
          <div className="hero-badge"><i className="fas fa-bolt" /> BMS Platform</div>
          <div className="hero-line" />
          <h1 className="hero-title">
            <span className="word"><span className="glow-text" data-text="Create.">Create.</span></span>
            <span className="word"><span className="glow-text" data-text="Innovate.">Innovate.</span></span>
            <span className="word"><span className="glow-text" data-text="Elevate.">Elevate.</span></span>
          </h1>
          <p className="hero-sub">Premium Roblox Development & Digital Store — under one <span className="glow-word">BMS Platform</span>.</p>
          <div className="hero-cta">
            <Link href="/services" className="btn btn-primary btn-lg">Our Services</Link>
            <Link href="/store" className="btn btn-outline btn-lg">Explore Store</Link>
          </div>
        </div>
        <div className="hero-scroll"><span className="mouse" /><span>Scroll</span></div>
      </section>

      <div className="marquee"><div className="marquee-track">
        {["Web Development","Roblox Game Dev","Mobile App","UI/UX Design","Discord Bot","Backend & API","3D Modeling","Game Scripting","Audio Production","Server Management"].map(s=>(
          <span key={s} className="marquee-item"><i className="fas fa-star" /> {s}</span>
        ))}
      </div></div>

      <section className="section">
        <h2 className="section-title" data-eyebrow="The Studio">Why <span className="text-gradient">BMS STUDIO</span>?</h2>
        <p className="section-desc">Tim profesional dengan pengalaman bertahun-tahun dalam pengembangan game dan layanan digital.</p>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-number">150+</div><div className="stat-label">Projects</div></div>
          <div className="stat-card"><div className="stat-number">98%</div><div className="stat-label">Satisfaction</div></div>
          <div className="stat-card"><div className="stat-number">50+</div><div className="stat-label">Team</div></div>
          <div className="stat-card"><div className="stat-number">5+</div><div className="stat-label">Years</div></div>
        </div>
      </section>

      <section className="section" style={{background:'var(--bg-2)',padding:'80px 20px',maxWidth:'none'}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <h2 className="section-title" data-eyebrow="Services">Featured <span className="text-gradient">Services</span></h2>
          <div className="services-grid">
            {(services.length?services:[{name:'Web Development',description:'Modern website',category:'Web'},{name:'Roblox Game',description:'High perf game',category:'Roblox'},{name:'UI/UX Design',description:'Elegant design',category:'Design'}]).map((s,i)=>(
              <div key={i} className="service-card">
                <div className="service-icon"><i className="fas fa-cube" /></div>
                <h3>{s.name}</h3><p>{s.description}</p><div className="service-tags"><span>{s.category}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title" data-eyebrow="Store">From <span className="text-gradient">BMS STORE</span></h2>
        <p className="section-desc">Produk digital terbaru dan terlaris.</p>
        <div className="assets-grid">
          {(products.length?products:[{name:'Demo Product',price:'Gratis',category:'other'}]).map((p,i)=>(
            <div key={i} className="asset-card">
              <div className="asset-thumb"><i className="fas fa-cube" /></div>
              <div className="asset-body"><h3>{p.name}</h3><span className="asset-price">{p.price}</span></div>
            </div>
          ))}
        </div>
        <div style={{textAlign:'center',marginTop:28}}><Link href="/store" className="btn btn-outline">Lihat Semua Produk</Link></div>
      </section>

      <section className="section" style={{background:'var(--bg-2)',padding:'80px 20px',maxWidth:'none',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:'4%',top:'10%',opacity:0.9}} className="mascot-hide-mobile">
          <Mascot src="/mascot/maskot-love-peluk-hati.png" size={200} alt="Love" />
        </div>
        <div style={{maxWidth:1200,margin:'0 auto',position:'relative',zIndex:2}}>
          <h2 className="section-title" data-eyebrow="Testimonials">What Our <span className="text-gradient">Clients Say</span></h2>
          <div className="testi-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
            {(testimonials.length?testimonials:[{user_name:'Client',text:'Great service!',rating:5}]).map((t,i)=>(
              <div key={i} className="glass" style={{padding:20,borderRadius:16}}><p style={{fontSize:13}}>&quot;{t.text}&quot;</p><div style={{marginTop:8,fontWeight:600}}>{t.user_name}</div></div>
            ))}
          </div>
        </div>
      </section>

      <section style={{padding:'60px 20px',maxWidth:1000,margin:'40px auto',background:'linear-gradient(135deg,rgba(230,227,220,.08),rgba(150,172,159,.06))',border:'1px solid rgba(255,255,255,.08)',borderRadius:24,display:'flex',alignItems:'center',gap:24,flexWrap:'wrap',justifyContent:'center',position:'relative',overflow:'hidden'}}>
        <Mascot src="/mascot/maskot-lets-go-semangat.png" size={220} alt="Lets Go" />
        <div style={{flex:1,minWidth:240,textAlign:'center'}}>
          <h2 style={{fontSize:28,fontWeight:800,fontFamily:'Syne'}}>Siap mulai project?</h2>
          <p style={{color:'var(--text-muted)',marginTop:8,fontSize:15}}>Konsultasi gratis — tim BMS siap bantu wujudkan ide kamu.</p>
          <Link href="/contact" className="btn btn-primary" style={{marginTop:16,display:'inline-flex'}}>Hubungi Kami →</Link>
        </div>
      </section>
    </div>
  )
}
