import React, { useState } from 'react'

function ImagePlaceholder({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`bg-[#ecf3fe] flex items-center justify-center rounded-[4px] ${className ?? ''}`}
      style={style}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <path d="M2.66667 24H21.3333C22.8 24 24 22.8 24 21.3333V2.66667C24 1.2 22.8 0 21.3333 0H2.66667C1.2 0 0 1.2 0 2.66667V21.3333C0 22.8 1.2 24 2.66667 24ZM7.33333 5.33333C8.44 5.33333 9.33333 6.22667 9.33333 7.33333C9.33333 8.44 8.44 9.33333 7.33333 9.33333C6.22667 9.33333 5.33333 8.44 5.33333 7.33333C5.33333 6.22667 6.22667 5.33333 7.33333 5.33333ZM2.66667 19.2133L6.66667 15.2133L8.38667 16.9333C8.90667 17.4533 9.74667 17.4533 10.2667 16.9333L17.32 9.88L21.32 13.88V21.3333H2.65333V19.2133H2.66667Z" fill="white" />
      </svg>
    </div>
  )
}

export { ImagePlaceholder }

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, ...rest } = props

  if (didError || !src) {
    return <ImagePlaceholder className={className} style={style} />
  }

  return (
    <img src={src} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}
