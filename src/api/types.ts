export type SourceType = 'tiktok' | 'reddit' | 'mistergoodbeer'

export type HappyHour = {
  from: string
  to: string
  pintPrice: number
}

export type Bar = {
  id: string
  rank: number
  name: string
  address: string
  arrondissement: string
  lat: number
  lng: number
  photos: string[]
  whyHere: string
  pintPrice: number | null
  happyHour: HappyHour | null
  openUntil: string | null
  googleMapsUrl: string
  sources: { type: SourceType; url: string }[]
}

export type SearchResponse = {
  query: string
  results: Bar[]
}

export type ApiError = {
  error: string
}
