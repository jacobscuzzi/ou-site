import { useState } from 'react'
import { BeerIcon } from './icons'
import './Photo.css'

type Props = { src?: string; alt?: string; className?: string; onOpen?: () => void; openLabel?: string }

export default function Photo({ src, alt = '', className, onOpen, openLabel }: Props) {
  const [failedSrc, setFailedSrc] = useState<string>()
  const classes = className ? `photo ${className}` : 'photo'

  if (!src || failedSrc === src) {
    return (
      <span className={`${classes} photo-empty`} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
        <BeerIcon />
      </span>
    )
  }
  const img = <img src={src} alt={alt} loading="lazy" onError={() => setFailedSrc(src)} />
  if (!onOpen) return <span className={classes}>{img}</span>
  return (
    <button
      type="button"
      className={`${classes} photo-open`}
      aria-label={openLabel}
      onClick={(e) => {
        e.stopPropagation()
        onOpen()
      }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {img}
    </button>
  )
}
