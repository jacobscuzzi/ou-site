export type SourceType = 'tiktok' | 'reddit' | 'mistergoodbeer'

export type HappyHour = {
  from: string
  to: string
  pintPrice: number | null
}

export type TraitName =
  | 'terrace' | 'dancing' | 'smoking_area' | 'food' | 'vibe' | 'music'
  | 'crowd' | 'crowd_age' | 'busy_level' | 'noise'

export type ConstraintNotMet = {
  type: 'max_beer_price' | 'price_level' | 'opening' | 'happy_hour_opening' | 'location' | `trait:${TraitName}`
  requested: string | number | boolean
  actual: string | number | boolean | null
}

export type Facts = {
  terrace?: boolean
  dancing?: boolean
  music?: string[]
  vibe?: string[]
  busyLevel?: string
  crowdAge?: string
}

export type Description = {
  fr: string
  en: string
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
  compliant: boolean
  constraintsNotMet: ConstraintNotMet[]
  facts?: Facts
  description?: Description
}

export type SearchResponse = {
  searchId: string
  query: string
  results: Bar[]
  hasMore: boolean
  meta: { parsed: boolean; rankingVersion: number }
}

export type MapBar = {
  id: string
  name: string
  lat: number
  lng: number
  arrondissement: string
  quality: number
  pintPrice: number | null
  openUntil: string | null
  tags: string[]
  terrace?: boolean
  dancing?: boolean
  cover?: string
}

export type BarsResponse = {
  bars: MapBar[]
  updatedAt: string
}

export type ApiError = {
  error: string
}
