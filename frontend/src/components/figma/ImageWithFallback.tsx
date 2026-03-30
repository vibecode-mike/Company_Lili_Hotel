import React from 'react'

/** Transparent 1×1 gif used as <img> src so CSS background shows through */
const EMPTY_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/** Shared inline styles for the placeholder appearance */
const placeholderBg: React.CSSProperties = {
  backgroundColor: '#ecf3fe',
  backgroundImage: "url('/images/image-placeholder-icon.svg')",
  backgroundSize: '32px 32px',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
}

/**
 * Figma "Image Default" state as a plain <img>.
 * 32×32 icon always centered regardless of container size.
 */
export function ImagePlaceholder({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <img
      src={EMPTY_SRC}
      alt=""
      draggable={false}
      className={`rounded-[4px] ${className ?? ''}`}
      style={{ ...placeholderBg, ...style }}
    />
  )
}

/**
 * Drop-in <img> replacement with Figma placeholder fallback.
 * - Empty / missing src → placeholder
 * - Image load error    → swaps to placeholder via native DOM (no re-render)
 */
export function ImageWithFallback({ src, alt, className, style, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) {
  if (!src) {
    return <ImagePlaceholder className={className} style={style} />
  }

  return (
    <img
      src={src}
      alt={alt ?? ''}
      className={className}
      style={style}
      {...rest}
      onError={(e) => {
        const el = e.currentTarget
        if (el.src === EMPTY_SRC) return
        el.src = EMPTY_SRC
        Object.assign(el.style, placeholderBg)
        el.style.borderRadius = '4px'
      }}
    />
  )
}
