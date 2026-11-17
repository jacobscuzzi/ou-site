import { useEffect, useState } from 'react'
import { BeerIcon } from './icons'
import './Photo.css'

type Props = { src?: string; alt?: string; className?: string }

export default function Photo({ src, alt = '', className }: Props) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  const classes = className ? `photo ${className}` : 'photo'

  if (!src || failed) {
    return (
      <span className={`${classes} photo-empty`} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
        <BeerIcon size={24} />
      </span>
    )
  }
  return (
    <span className={classes}>
      <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
    </span>
  )
}
