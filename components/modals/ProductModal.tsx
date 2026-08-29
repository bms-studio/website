"use client"
export function ProductModal({ product, onClose, onAddToCart }: { product:any, onClose:()=>void, onAddToCart:(p:any)=>void }) {
  if(!product) return null
  return (
    <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.6)',backdropFilter:'blur(8px)',padding:20}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:520,maxWidth:'94vw',maxHeight:'90vh',overflowY:'auto',borderRadius:20,background:'var(--bg-2)',border:'1px solid var(--glass-border)',padding:0}}>
        <div style={{height:220,background:'var(--bg-3)',overflow:'hidden',position:'relative'}}>
          {product.image ? <img src={product.image} alt={product.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}><i className="fas fa-cube" style={{fontSize:40,color:'var(--text-dim)'}}/></div>}
          <button onClick={onClose} style={{position:'absolute',top:12,right:12,width:32,height:32,borderRadius:'50%',border:'none',background:'rgba(0,0,0,.5)',color:'#fff',cursor:'pointer'}}>×</button>
        </div>
        <div style={{padding:20}}>
          <h2 style={{fontSize:18,fontWeight:800}}>{product.name}</h2>
          <div style={{fontSize:20,fontWeight:800,marginTop:8,background:'var(--gradient-1)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{product.price}</div>
          <p style={{fontSize:13,color:'var(--text-muted)',marginTop:12,lineHeight:1.6}}>{product.description||'Tidak ada deskripsi.'}</p>
          <div style={{display:'flex',gap:8,marginTop:16}}>
            <button onClick={()=>{onAddToCart(product); onClose()}} className="btn btn-primary" style={{flex:1}}>Tambah ke Cart</button>
            <button onClick={onClose} style={{padding:'10px 16px',borderRadius:100,border:'1px solid var(--glass-border)',background:'transparent',cursor:'pointer'}}>Tutup</button>
          </div>
        </div>
      </div>
    </div>
  )
}
