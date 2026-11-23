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
  cuisine?: string[]
  pricePerPerson?: number
  signatureDishes?: string[]
  dietary?: string[]
  goodFor?: string[]
}

export type Dish = {
  section: string
  item: string
  description: string | null
  price: number | null
}

export type Description = {
  fr: string
  en: string
}

export type MenuCategory = 'beer' | 'wine' | 'cocktail' | 'spirit' | 'cider' | 'other'

export type MenuItem = {
  item: string
  category: MenuCategory
  price: number | null
  happyHourPrice: number | null
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
  menu: MenuItem[]
  dishes: Dish[]
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
  cuisine?: string
  pricePerPerson?: number
}

export type BarsResponse = {
  bars: MapBar[]
  updatedAt: string
}

export type ApiError = {
  error: string
}
