export type SourceType = 'tiktok' | 'reddit' | 'mistergoodbeer'

export type HappyHour = {
  from: string
  to: string
  pintPrice: number | null
}

export type ConstraintNotMet = {
  type: 'max_beer_price' | 'price_level' | 'opening' | 'happy_hour_opening' | 'location'
  requested: string | number
  actual: string | number | null
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
}

export type SearchResponse = {
  searchId: string
  query: string
  results: Bar[]
  hasMore: boolean
  meta: { parsed: boolean; rankingVersion: number }
}

export type ApiError = {
  error: string
}
