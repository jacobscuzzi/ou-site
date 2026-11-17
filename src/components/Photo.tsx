import { useState } from 'react'
import { BeerIcon } from './icons'
import './Photo.css'

type Props = { src?: string; alt?: string; className?: string }

export default function Photo({ src, alt = '', className }: Props) {
  const [failedSrc, setFailedSrc] = useState<string>()
  const failed = failedSrc === src
  const classes = className ? `photo ${className}` : 'photo'

  if (!src || failed) {
    return (
      <span className={`${classes} photo-empty`} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
        <BeerIcon />
      </span>
    )
  }
  return (
    <span className={classes}>
      <img src={src} alt={alt} loading="lazy" onError={() => setFailedSrc(src)} />
    </span>
  )
}
