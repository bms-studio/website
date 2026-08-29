"use client"
import Image from "next/image"

type Props = {
  src: string // e.g. /mascot/maskot-hi-menyapa-waving.png
  alt?: string
  size?: number // width
  className?: string
  style?: React.CSSProperties
  float?: boolean // gentle float animation
  hideOnMobile?: boolean
}

export function Mascot({ src, alt="BMS Mascot", size=180, className="", style, float=true, hideOnMobile=false }: Props) {
  return (
    <div
      className={`${float ? "mascot-float" : ""} ${hideOnMobile ? "mascot-hide-mobile" : ""} ${className}`}
      style={{
        width: size,
        height: size,
        position: "relative",
        flexShrink: 0,
        pointerEvents: "none",
        ...style,
      }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        style={{ width:"100%", height:"100%", objectFit:"contain", filter:"drop-shadow(0 12px 24px rgba(0,0,0,0.25))" }}
      />
    </div>
  )
}
