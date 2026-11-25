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
  coffeePrice?: number
  dishPrice?: number
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

export type Post = {
  platform: 'tiktok'
  postId: string
  url: string
  author: string
  likes: number | null
  kind: 'video' | 'photo'
  thumb: string | null
}

export type MenuCategory = 'beer' | 'wine' | 'cocktail' | 'spirit' | 'cider' | 'other'

export type MenuItem = {
  item: string
  category: MenuCategory
  price: number | null
  happyHourPrice: number | null
}

export type OpeningPeriod = {
  day: 1 | 2 | 3 | 4 | 5 | 6 | 7
  open: string
  close: string
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
  thumbs?: string[]
  tags?: string[]
  whyHere: string
  pintPrice: number | null
  happyHour: HappyHour | null
  openUntil: string | null
  openNow?: boolean
  hours?: OpeningPeriod[]
  kinds: string[]
  googleMapsUrl: string
  sources: { type: SourceType; url: string }[]
  compliant: boolean
  constraintsNotMet: ConstraintNotMet[]
  facts?: Facts
  description?: Description
  menu: MenuItem[]
  dishes: Dish[]
  posts: Post[]
  events: Event[]
  deal?: Event
  actions: Action[]
}

export type ActionKind = 'tickets' | 'offer' | 'booking' | 'venue_page' | 'website' | 'directions'

export type Action = {
  kind: ActionKind
  provider: string
  url: string
}

export type Event = {
  id: string
  kind: 'party' | 'deal'
  placeId: string
  placeName: string
  title: string
  night: string | null
  startsAt: string | null
  endsAt: string | null
  regular: boolean
  genres: string[]
  lineup: string[]
  priceMin: number | null
  priceMax: number | null
  discountPct: number | null
  conditions: string | null
  validUntil: string | null
  image: string | null
  photo: string | null
  lat: number
  lng: number
  sources: string[]
  posts: Post[]
  actions: Action[]
  description?: string | null
  vibes?: string[]
  priceBucket?: PriceBucket | null
  doorTime?: string | null
  minAge?: number | null
  priceTiers?: { name: string; price: number | null }[]
  dealKind?: DealKind
  dealValue?: number
  popularity?: number
}

export type DealKind = 'pct' | 'bogo' | 'off' | 'menu' | 'free' | 'other'

export type PriceBucket = 'free' | 'low' | 'mid' | 'high'

export type DanceMode = 'club' | 'party_bar' | 'event_venue'

export type EventsResponse = {
  events: Event[]
  from: string
  to: string
  layer?: Layer
  places?: MapBar[]
}

export type PostsResponse = {
  posts: Record<string, Post[]>
}

export type DaysResponse = {
  days: { date: string; count: number }[]
  layer?: Layer
}

export type Layer = 'drink' | 'eat' | 'dance' | 'coffee'

export type Venue = 'bar' | 'restaurant' | 'cafe' | 'all'

export type SearchResponse = {
  searchId: string
  query: string
  venue: Venue
  layer?: Layer
  results: Bar[]
  hasMore: boolean
  meta: { parsed: boolean; rankingVersion: number; layerSwitched?: boolean; dateRange?: { from: string; to: string } }
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
  kinds: string[]
  tags: string[]
  terrace?: boolean
  dancing?: boolean
  cover?: string
  cuisine?: string
  cuisines?: string[]
  music?: string[]
  pricePerPerson?: number
  coffeePrice?: number
  dishPrice?: number
  deal?: boolean
  dealPct?: number
  dealKind?: DealKind
  dealValue?: number
  action?: Action
  danceMode?: DanceMode
}

export type BarsResponse = {
  bars: MapBar[]
  updatedAt: string
  layer?: Layer
}

export type LayersResponse = {
  layers: { id: Layer; count: number; available: boolean }[]
}

export type ApiError = {
  error: string
}

export type SignalKind = 'like' | 'want' | 'dislike'

export type SignalsResponse = {
  signals: { placeId: string; kind: SignalKind; updatedAt: string }[]
}
