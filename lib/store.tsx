"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { api } from "./api"

type User = { id:number; email:string; name:string; role:string; avatar?:string; banner?:string; xp?:number; bio?:string; verified_tag?:number; ref_code?:string } | null

type Store = {
  user: User
  isLoggedIn: boolean
  cart: any[]
  wishlist: number[]
  loading: boolean
  refreshAuth: () => Promise<void>
  addToCart: (item:any)=>void
  removeFromCart: (id:number)=>void
  toggleWishlist: (id:number)=>void
}

const Ctx = createContext<Store>(null as any)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [cart, setCart] = useState<any[]>(() => {
    if (typeof window==="undefined") return []
    try { return JSON.parse(localStorage.getItem("bms_cart")||"[]") } catch { return [] }
  })
  const [wishlist, setWishlist] = useState<number[]>(() => {
    if (typeof window==="undefined") return []
    try { return JSON.parse(localStorage.getItem("bms_wishlist")||"[]") } catch { return [] }
  })
  const [loading, setLoading] = useState(true)

  async function refreshAuth() {
    try {
      const d = await api("/auth/session", { cache:false })
      setUser(d.user||null)
    } catch { setUser(null) }
    setLoading(false)
  }
  useEffect(()=>{ refreshAuth() },[])
  useEffect(()=>{ try{localStorage.setItem("bms_cart",JSON.stringify(cart))}catch{} },[cart])
  useEffect(()=>{ try{localStorage.setItem("bms_wishlist",JSON.stringify(wishlist))}catch{} },[wishlist])

  function addToCart(item:any){
    setCart(c=> {
      const ex=c.find(x=>x.id===item.id)
      if(ex) return c.map(x=>x.id===item.id?{...x,qty:(x.qty||1)+1}:x)
      return [...c,{...item,qty:1}]
    })
  }
  function removeFromCart(id:number){ setCart(c=>c.filter(x=>x.id!==id)) }
  function toggleWishlist(id:number){ setWishlist(w=> w.includes(id)? w.filter(x=>x!==id): [...w,id]) }

  return <Ctx.Provider value={{user,isLoggedIn:!!user,cart,wishlist,loading,refreshAuth,addToCart,removeFromCart,toggleWishlist}}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
