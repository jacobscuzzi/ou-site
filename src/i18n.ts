import { createContext, useContext } from 'react'
import type { ConstraintNotMet, Layer } from './api/types'
import { useLayer } from './mode'

export type Lang = 'en' | 'fr'

function amount(v: string | number | boolean, lang: Lang) {
  const n = Number(v)
  if (Number.isNaN(n)) return String(v)
  const text = Number.isInteger(n) ? String(n) : n.toFixed(2)
  return lang === 'fr' ? text.replace('.', ',') : text
}

function clock(v: string | number | boolean) {
  return String(v).match(/\d{1,2}:\d{2}/)?.[0] ?? null
}

const levels = {
  en: { cheap: 'cheap', moderate: 'mid-range', expensive: 'upscale' },
  fr: { cheap: 'pas cher', moderate: 'moyen', expensive: 'chic' },
}

function level(v: string | number | boolean, lang: Lang) {
  return levels[lang][v as keyof (typeof levels)['en']] ?? String(v)
}

const traits = {
  en: {
    missing: { terrace: 'No terrace', dancing: 'No dancing', smoking_area: 'No smoking area', food: 'No food' },
    unknown: {
      terrace: 'Terrace not confirmed',
      dancing: 'Dancing not confirmed',
      smoking_area: 'Smoking area not confirmed',
      food: 'Food not confirmed',
    },
    labels: { vibe: 'Vibe', music: 'Music', crowd: 'Crowd', crowd_age: 'Age', busy_level: 'Crowd level', noise: 'Noise' },
  },
  fr: {
    missing: { terrace: 'Pas de terrasse', dancing: "On n'y danse pas", smoking_area: 'Pas de fumoir', food: 'Pas de cuisine' },
    unknown: {
      terrace: 'Terrasse à confirmer',
      dancing: 'Danse à confirmer',
      smoking_area: 'Fumoir à confirmer',
      food: 'Cuisine à confirmer',
    },
    labels: { vibe: 'Ambiance', music: 'Musique', crowd: 'Public', crowd_age: 'Âge', busy_level: 'Affluence', noise: 'Bruit' },
  },
}

function traitHint(c: ConstraintNotMet, lang: Lang) {
  const name = c.type.replace('trait:', '')
  const t = traits[lang]
  if (name in t.missing) {
    const key = name as keyof typeof t.missing
    return c.actual === null ? t.unknown[key] : t.missing[key]
  }
  const label = t.labels[name as keyof typeof t.labels] ?? name
  const asked = String(c.requested).replace(/_/g, ' ')
  if (c.actual === null) return lang === 'fr' ? `${label} : ${asked} à confirmer` : `${label}: ${asked} not confirmed`
  const here = String(c.actual).replace(/_/g, ' ')
  return lang === 'fr' ? `${label} : ${here} (demandé : ${asked})` : `${label}: ${here}, asked ${asked}`
}

const en = {
  eyebrow: 'Paris, tonight',
  tagline: "Let's find the best bar for you.",
  placeholder: 'Describe your night',
  search: 'Search',
  startOver: 'Start over',
  classicSearch: 'Classic search',
  showMap: 'Show the map',
  suggestions: [
    ['Cheap pints near metro line 2', 'A cozy wine bar for a first date in the 11e', 'Cocktail bar open after 2am near Pigalle'],
    ['Big terrace for 10 people tonight', 'A bar to dance in on Thursday night'],
  ],
  thinking: 'Running the numbers',
  picks: (n: number) => n === 1 ? '1 pick for tonight' : `${n} picks for tonight`,
  till: (t: string) => `Till ${t}`,
  chipOpen: 'Open now',
  chipTerrace: 'Terrace',
  chipDancing: 'People dance',
  chipCheap: (n: number) => `Pint under ${n} EUR`,
  chipMeal: (n: number) => `Meals under ${n} EUR`,
  chipFastFood: (n: number) => `Fast food under ${n} EUR`,
  chipEspresso: (n: number) => `Espresso under ${n} EUR`,
  chipGroups: {
    asian: 'Asian',
    kebab: 'Kebab',
    street: 'Burgers & street food',
    italian: 'Italian & pizza',
    brunch: 'Brunch',
    oriental: 'Middle Eastern',
    indian: 'Indian',
    african: 'African',
    french: 'French',
    techno: 'Techno & electro',
    hiphop: 'Hip-hop & afro',
    latin: 'Latin',
    live: 'Live & jazz',
    karaoke: 'Karaoke',
    clubs: 'Clubs',
    dancebars: 'Dance bars',
    laptop: 'Laptop friendly',
    quiet: 'Quiet',
    bakery: 'Bakery',
    deal: 'Bons plans',
  },
  chipsLabel: 'Filters',
  tonight: 'Tonight',
  nightsLabel: 'Pick a night',
  moreDates: 'More dates',
  monthTitle: 'Pick a date',
  prevMonth: 'Previous month',
  nextMonth: 'Next month',
  partiesCount: (n: number) => (n === 1 ? '1 party' : `${n} parties`),
  eventsTitle: (when: string, n: number) => (n === 1 ? `1 party ${when}` : `${n} parties ${when}`),
  whenTonight: 'tonight',
  whenWeekend: 'this weekend',
  whenOn: (day: string) => `on ${day}`,
  eventsEmpty: 'No party known for this night',
  eventsEmptyHint: 'Faded dots are clubs without a listed event. Try another night.',
  eventsError: "Couldn't load the parties",
  regularNight: 'Regular night',
  free: 'Free',
  fromPrice: (p: string) => `From ${p}`,
  nextEvents: 'Next parties',
  seeEvent: (title: string) => `Tonight: ${title}, see the party`,
  dealBadge: 'Bon plan',
  dealUntil: (d: string) => `until ${d}`,
  dealRecent: 'seen this week',
  actions: {
    tickets: 'Get a ticket',
    offer: 'See the offer',
    bookTable: 'Book a table',
    book: 'Book',
    shotgun: 'See on Shotgun',
    ra: 'See on Resident Advisor',
    venue: 'Club page',
    website: 'Website',
    directions: 'Directions',
  },
  moreActions: 'Links',
  exploreTitle: 'Top bars in view',
  exploreEmpty: 'No bar matches here',
  exploreEmptyHint: 'Zoom out or remove a filter.',
  exploreLoading: 'Loading bars',
  exploreWarming: 'The bars are warming up, retrying.',
  exploreError: "Couldn't load the bars",
  back: 'Back',
  barLoading: 'Loading the bar',
  barError: "Couldn't load this bar",
  barWarming: 'The bars are still loading, try again in a moment.',
  barMissing: 'This bar is no longer listed.',
  openUntil: (t: string) => `Open until ${t}`,
  pint: (p: string) => `Pint ${p}`,
  happyHour: (from: string, to: string) => `Happy hour ${from}–${to}:`,
  whyHere: 'Why here?',
  menuTitle: 'Menu',
  menuHappyHour: 'HH',
  menuShowAll: (n: number) => `Show the full menu (${n})`,
  menuShowLess: 'Show less',
  menuNote: 'Prices reported by the community, may have changed.',
  menuCategories: { beer: 'Beer', wine: 'Wine', cocktail: 'Cocktails', spirit: 'Spirits', cider: 'Cider', other: 'Other' },
  coffeePrice: (p: string) => `Espresso ${p}`,
  dishPrice: { pizza: 'Pizza', burger: 'Burger', kebab: 'Kebab', ramen: 'Ramen', dish: 'Dish' },
  specialty: 'Specialty coffee',
  laptop: 'Laptop-friendly',
  crowdAge: (a: string) => `Crowd ${a}`,
  busy: { quiet: 'Quiet', moderate: 'Fills up', packed: 'Packed' } as Record<string, string>,
  dishesShowAll: (n: number) => `Show all dishes (${n})`,
  dishesNote: 'Menu from Google Maps, prices may have changed.',
  openMaps: 'Open in Google Maps',
  errorTitle: 'Something went wrong',
  timeout: 'The search took too long, please try again.',
  retry: 'Try again',
  more: 'Show more bars',
  loadingMore: 'Loading…',
  moreError: "Couldn't load more bars",
  emptyTitle: 'Nothing for that yet',
  emptyText: 'Try describing the evening differently.',
  credit: 'Map data from OpenStreetMap contributors',
  locate: 'Show my location',
  metroShow: 'Show metro lines',
  metroHide: 'Hide metro lines',
  mapLabel: 'Map of bars in Paris',
  sheetLabel: 'Bar list',
  sheetHandle: { peek: 'List hidden, show it', half: 'List half open, hide it', full: 'List fully open, lower it' },
  backToMap: 'Back to the map',
  searchHere: 'Search this area',
  postsTitle: 'On TikTok',
  postLabel: (author: string, kind: 'video' | 'photo') => `${kind === 'photo' ? 'Photos' : 'Video'} by @${author} on TikTok`,
  watchPosts: (n: number) => (n === 1 ? 'Watch the TikTok about this place' : `Watch ${n} TikToks about this place`),
  feedLabel: (place: string) => `TikToks about ${place}`,
  feedPosition: (i: number, n: number) => `TikTok ${i} of ${n}`,
  swipeMore: 'Swipe up for more',
  openOnTikTok: 'Open on TikTok',
  watchOnTikTok: 'Watch on TikTok',
  feedEnd: 'Feel like going?',
  soundOn: 'Turn the sound on',
  soundOff: 'Turn the sound off',
  close: 'Close',
  layerMenu: (name: string) => `${name}, change layer`,
  layerNames: { drink: 'Have Drinks', eat: 'Lets Eat', dance: 'Go out', coffee: 'Coffee' } as Record<Layer, string>,
  introLabel: 'Where the fuck in Paris? où',
  skipIntro: 'Skip the intro',
  photosOf: (name: string) => `Photos of ${name}`,
  comingUp: 'Coming up',
  clearSearch: 'Clear the search',
  like: 'Like',
  liked: 'Liked, tap to undo',
  want: 'Want to go',
  wanted: 'On your list, tap to undo',
  dislike: 'Not for me',
  disliked: 'Marked not for me, tap to undo',
  moreOptions: 'More options',
  reportWrong: 'Report wrong info',
  reportQuestion: "What's wrong?",
  reportPlaceholder: 'Closed for good, wrong hours, wrong price…',
  reportSend: 'Send',
  reportThanks: "Thanks, we'll check it",
  reportFailed: 'Could not send, try again',
  myPlaces: 'My places',
  favorites: 'Favorites',
  wantToGo: 'Want to go',
  notForMe: (n: number) => `Not for me (${n})`,
  undo: 'Undo',
  emptyFavorites: 'Tap the heart on a place to keep it here.',
  emptyWant: 'Tap the bookmark on a place you want to try.',
  searchTag: (tag: string) => `Search places tagged ${tag} here`,
  focusDeals: 'Deals',
  focusDealsOn: 'Showing deals only, show everything',
  focusDealsOff: 'Show only places with a deal',
  dealsTitle: (n: number) => (n === 1 ? '1 place with a deal' : `${n} places with a deal`),
  dealsEmpty: 'No deal in this part of the map',
  dealVia: (source: string) => `via ${source}`,
  dealConditions: 'Conditions',
  bookWithDeal: 'Book with this deal',
  getTickets: 'Get tickets',
  doorsAt: (time: string) => `Doors ${time}`,
  minAge: (n: number) => `${n}+`,
  lineupTitle: 'Line-up',
  showOnMap: 'Show on map',
  moreDetails: 'More',
  lessDetails: 'Less',
  agendaOpen: (n: number) => (n === 1 ? 'Agenda, 1 party tonight' : `Agenda, ${n} parties tonight`),
  agendaTitle: 'Agenda',
  agendaGenre: 'Music',
  agendaPrice: 'Price',
  agendaVibe: 'Vibe',
  agendaArea: 'In this map area',
  agendaCount: (n: number) => (n === 1 ? '1 party' : `${n} parties`),
  agendaEmpty: 'No party matches these filters',
  agendaClear: 'Clear filters',
  modeQuestion: 'What are you up for?',
  modeOptions: { coffee: 'A coffee', eat: 'Something to eat', drink: 'Drinks', dance: 'Going out' } as Record<Layer, string>,
  modeSkip: 'Show me the map',
  layerSwitched: (name: string) => `Switched to ${name} for this search`,
  danceKinds: { club: 'Club', bar: 'Dance bar' },
  hoursState: { open: 'Open now', closed: 'Closed now', unknown: 'Hours unknown' },
  hoursUntil: (t: string) => `until ${t}`,
  hoursAllDay: 'Open 24 hours',
  hoursOpens: (t: string) => `opens at ${t}`,
  hoursOpensTomorrow: (t: string) => `opens tomorrow at ${t}`,
  hoursOpensDay: (day: string, t: string) => `opens ${day} at ${t}`,
  hoursWeek: 'Opening hours for the week',
  hoursDayClosed: 'Closed',
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  installTitle: 'Add où to your home screen',
  installText: 'It opens like an app, straight on the map.',
  installAction: 'Install',
  installClose: 'Not now',
  installIosSteps: ['Tap the three-dot button next to the address bar', 'Tap Share', 'Tap Add to Home Screen'],
  installIosShareSteps: ['Tap the Share button of your browser', 'Tap Add to Home Screen'],
  installAndroidSteps: ['Open the browser menu (three dots)', 'Tap Add to Home screen or Install app'],
  installInAppTitle: 'Open où in your browser',
  installInAppIos: "You can't install it from this app. Open the page in Safari, then add it to your home screen.",
  installInAppAndroid: "You can't install it from this app. Open the page in Chrome, then add it to your home screen.",
  installOpenChrome: 'Open in Chrome',
  hint: (c: ConstraintNotMet) => {
    switch (c.type) {
      case 'max_beer_price':
        return c.actual === null
          ? 'Pint price unknown'
          : `Pint ${amount(c.actual, 'en')} EUR (asked ≤ ${amount(c.requested, 'en')} EUR)`
      case 'price_level': {
        const asked = level(c.requested, 'en')
        const wanted = asked.charAt(0).toUpperCase() + asked.slice(1)
        return c.actual === null
          ? `${wanted} asked, pint price unknown`
          : `${wanted} asked, pint ${amount(c.actual, 'en')} EUR`
      }
      case 'opening':
        return c.requested === 'open now' ? 'Closed right now' : `Closed at the requested time (${clock(c.requested) ?? c.requested})`
      case 'happy_hour_opening': {
        const at = clock(c.requested)
        return at ? `No happy hour at ${at}` : 'No happy hour at the requested time'
      }
      case 'location':
        return `Far from ${c.requested}`
      default:
        return traitHint(c, 'en')
    }
  },
}

const fr: typeof en = {
  eyebrow: 'Paris, ce soir',
  tagline: 'Trouvons le meilleur bar pour toi.',
  placeholder: 'Décris ta soirée',
  search: 'Rechercher',
  startOver: 'Recommencer',
  classicSearch: 'Recherche classique',
  showMap: 'Afficher la carte',
  suggestions: [
    ['Des pintes pas chères sur la ligne 2', 'Un bar à vin cosy pour un premier date dans le 11e', 'Un bar à cocktails ouvert après 2h vers Pigalle'],
    ['Une grande terrasse pour 10 ce soir', 'Un bar où on danse vraiment le jeudi'],
  ],
  thinking: 'On fait les comptes',
  picks: (n: number) => n === 1 ? '1 adresse pour ce soir' : `${n} adresses pour ce soir`,
  till: (t: string) => `Jusqu'à ${t}`,
  chipOpen: 'Ouvert',
  chipTerrace: 'Terrasse',
  chipDancing: 'On danse',
  chipCheap: (n: number) => `Pinte sous ${n} EUR`,
  chipMeal: (n: number) => `Plats à moins de ${n} €`,
  chipFastFood: (n: number) => `Fast-food à moins de ${n} €`,
  chipEspresso: (n: number) => `Expresso à moins de ${n} €`,
  chipGroups: {
    asian: 'Asiatique',
    kebab: 'Kebab',
    street: 'Burgers & street food',
    italian: 'Italien & pizza',
    brunch: 'Brunch',
    oriental: 'Oriental',
    indian: 'Indien',
    african: 'Africain',
    french: 'Français',
    techno: 'Techno & électro',
    hiphop: 'Hip-hop & afro',
    latin: 'Latino',
    live: 'Live & jazz',
    karaoke: 'Karaoké',
    clubs: 'Clubs',
    dancebars: 'Bars dansants',
    laptop: 'Laptop bienvenu',
    quiet: 'Calme',
    bakery: 'Boulangerie',
    deal: 'Bons plans',
  },
  chipsLabel: 'Filtres',
  tonight: 'Ce soir',
  nightsLabel: 'Choisir une soirée',
  moreDates: "Plus de dates",
  monthTitle: 'Choisir une date',
  prevMonth: 'Mois précédent',
  nextMonth: 'Mois suivant',
  partiesCount: (n: number) => (n === 1 ? '1 soirée' : `${n} soirées`),
  eventsTitle: (when: string, n: number) => (n === 1 ? `1 soirée ${when}` : `${n} soirées ${when}`),
  whenTonight: 'ce soir',
  whenWeekend: 'ce week-end',
  whenOn: (day: string) => day,
  eventsEmpty: 'Aucune soirée connue ce soir-là',
  eventsEmptyHint: 'Les points pâles sont des clubs sans soirée annoncée. Essaie une autre date.',
  eventsError: 'Impossible de charger les soirées',
  regularNight: 'Soirée régulière',
  free: 'Gratuit',
  fromPrice: (p: string) => `Dès ${p}`,
  nextEvents: 'Prochaines soirées',
  seeEvent: (title: string) => `Ce soir : ${title}, voir la soirée`,
  dealBadge: 'Bon plan',
  dealUntil: (d: string) => `jusqu'au ${d}`,
  dealRecent: 'vu cette semaine',
  actions: {
    tickets: 'Prendre un billet',
    offer: "Voir l'offre",
    bookTable: 'Réserver une table',
    book: 'Réserver',
    shotgun: 'Voir sur Shotgun',
    ra: 'Voir sur Resident Advisor',
    venue: 'Page du club',
    website: 'Site web',
    directions: 'Itinéraire',
  },
  moreActions: 'Liens',
  exploreTitle: 'Les meilleurs bars ici',
  exploreEmpty: 'Aucun bar ne correspond ici',
  exploreEmptyHint: 'Dézoome ou retire un filtre.',
  exploreLoading: 'Chargement des bars',
  exploreWarming: 'Les bars se réveillent, nouvelle tentative.',
  exploreError: 'Impossible de charger les bars',
  back: 'Retour',
  barLoading: 'Chargement du bar',
  barError: 'Impossible de charger ce bar',
  barWarming: 'Les bars se chargent encore, réessaie dans un instant.',
  barMissing: "Ce bar n'est plus référencé.",
  openUntil: (t: string) => `Ouvert jusqu'à ${t}`,
  pint: (p: string) => `Pinte ${p}`,
  happyHour: (from: string, to: string) => `Happy hour ${from}–${to} :`,
  whyHere: 'Pourquoi ici ?',
  menuTitle: 'La carte',
  menuHappyHour: 'HH',
  menuShowAll: (n: number) => `Voir toute la carte (${n})`,
  menuShowLess: 'Réduire',
  menuNote: 'Prix signalés par la communauté, ils ont pu changer.',
  menuCategories: { beer: 'Bière', wine: 'Vin', cocktail: 'Cocktails', spirit: 'Spiritueux', cider: 'Cidre', other: 'Autres' },
  coffeePrice: (p: string) => `Expresso ${p}`,
  dishPrice: { pizza: 'Pizza', burger: 'Burger', kebab: 'Kebab', ramen: 'Ramen', dish: 'Plat' },
  specialty: 'Café de spécialité',
  laptop: 'Ordi bienvenu',
  crowdAge: (a: string) => `Public ${a}`,
  busy: { quiet: 'Calme', moderate: 'Se remplit', packed: 'Bondé' },
  dishesShowAll: (n: number) => `Voir tous les plats (${n})`,
  dishesNote: 'Carte issue de Google Maps, les prix ont pu changer.',
  openMaps: 'Ouvrir dans Google Maps',
  errorTitle: 'Un problème est survenu',
  timeout: 'La recherche a pris trop de temps, réessaie.',
  retry: 'Réessayer',
  more: "Voir plus d'adresses",
  loadingMore: 'Chargement…',
  moreError: "Impossible de charger plus d'adresses",
  emptyTitle: 'Rien pour ça, pour le moment',
  emptyText: 'Essaie de décrire la soirée autrement.',
  credit: 'Données cartographiques OpenStreetMap',
  locate: 'Me localiser',
  metroShow: 'Afficher les lignes de métro',
  metroHide: 'Masquer les lignes de métro',
  mapLabel: 'Carte des bars de Paris',
  sheetLabel: 'Liste des bars',
  sheetHandle: { peek: "Liste masquée, l'afficher", half: 'Liste à moitié ouverte, la masquer', full: 'Liste ouverte, la descendre' },
  backToMap: 'Revenir à la carte',
  searchHere: 'Rechercher ici',
  postsTitle: 'Sur TikTok',
  postLabel: (author: string, kind: 'video' | 'photo') => `${kind === 'photo' ? 'Photos' : 'Vidéo'} de @${author} sur TikTok`,
  watchPosts: (n: number) => (n === 1 ? 'Voir le TikTok sur ce lieu' : `Voir ${n} TikToks sur ce lieu`),
  feedLabel: (place: string) => `TikToks sur ${place}`,
  feedPosition: (i: number, n: number) => `TikTok ${i} sur ${n}`,
  swipeMore: 'Glisse vers le haut pour la suite',
  openOnTikTok: 'Ouvrir sur TikTok',
  watchOnTikTok: 'Voir sur TikTok',
  feedEnd: 'Ça te donne envie ?',
  soundOn: 'Activer le son',
  soundOff: 'Couper le son',
  close: 'Fermer',
  layerMenu: (name: string) => `${name} affiché, changer`,
  layerNames: { drink: 'Boire un verre', eat: 'Manger', dance: 'Danser', coffee: 'Café' },
  introLabel: 'Where the fuck in Paris? où',
  skipIntro: "Passer l'intro",
  photosOf: (name: string) => `Photos de ${name}`,
  comingUp: 'À venir',
  clearSearch: 'Effacer la recherche',
  like: "J'aime",
  liked: 'Aimé, toucher pour annuler',
  want: 'À tester',
  wanted: 'Dans ta liste, toucher pour annuler',
  dislike: 'Pas pour moi',
  disliked: 'Marqué pas pour moi, toucher pour annuler',
  moreOptions: "Plus d'options",
  reportWrong: 'Signaler une erreur',
  reportQuestion: "Qu'est-ce qui ne va pas ?",
  reportPlaceholder: 'Fermé définitivement, mauvais horaires, mauvais prix…',
  reportSend: 'Envoyer',
  reportThanks: 'Merci, on va vérifier',
  reportFailed: "Envoi impossible, réessaie",
  myPlaces: 'Mes lieux',
  favorites: 'Favoris',
  wantToGo: 'À tester',
  notForMe: (n: number) => `Pas pour moi (${n})`,
  undo: 'Annuler',
  emptyFavorites: 'Touche le cœur sur un lieu pour le garder ici.',
  emptyWant: 'Touche le marque-page sur un lieu que tu veux tester.',
  searchTag: (tag: string) => `Chercher « ${tag} » ici`,
  focusDeals: 'Bons plans',
  focusDealsOn: 'Bons plans seulement, tout afficher',
  focusDealsOff: 'Seulement les lieux avec un bon plan',
  dealsTitle: (n: number) => (n === 1 ? '1 lieu avec un bon plan' : `${n} lieux avec un bon plan`),
  dealsEmpty: 'Aucun bon plan dans cette partie de la carte',
  dealVia: (source: string) => `via ${source}`,
  dealConditions: 'Conditions',
  bookWithDeal: 'Réserver avec ce bon plan',
  getTickets: 'Prendre des billets',
  doorsAt: (time: string) => `Ouverture ${time}`,
  minAge: (n: number) => `${n} ans et +`,
  lineupTitle: 'Line-up',
  showOnMap: 'Voir sur la carte',
  moreDetails: 'Plus',
  lessDetails: 'Moins',
  agendaOpen: (n: number) => (n === 1 ? 'Agenda, 1 soirée ce soir' : `Agenda, ${n} soirées ce soir`),
  agendaTitle: 'Agenda',
  agendaGenre: 'Musique',
  agendaPrice: 'Prix',
  agendaVibe: 'Ambiance',
  agendaArea: 'Dans cette zone',
  agendaCount: (n: number) => (n === 1 ? '1 soirée' : `${n} soirées`),
  agendaEmpty: 'Aucune soirée avec ces filtres',
  agendaClear: 'Effacer les filtres',
  modeQuestion: 'Tu cherches quoi ?',
  modeOptions: { coffee: 'Un café', eat: 'Manger un bout', drink: 'Boire un verre', dance: 'Sortir danser' },
  modeSkip: 'Voir la carte',
  layerSwitched: (name: string) => `${name} affiché pour cette recherche`,
  danceKinds: { club: 'Club', bar: 'Bar dansant' },
  hoursState: { open: 'Ouvert', closed: 'Fermé', unknown: 'Horaires inconnus' },
  hoursUntil: (t: string) => `jusqu'à ${t}`,
  hoursAllDay: 'Ouvert 24h/24',
  hoursOpens: (t: string) => `ouvre à ${t}`,
  hoursOpensTomorrow: (t: string) => `ouvre demain à ${t}`,
  hoursOpensDay: (day: string, t: string) => `ouvre ${day} à ${t}`,
  hoursWeek: 'Horaires de la semaine',
  hoursDayClosed: 'Fermé',
  days: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
  installTitle: "Ajoute où à ton écran d'accueil",
  installText: "Il s'ouvre comme une app, directement sur la carte.",
  installAction: 'Installer',
  installClose: 'Plus tard',
  installIosSteps: ["Touche le bouton à trois points à côté de la barre d'adresse", 'Touche Partager', "Touche Sur l'écran d'accueil"],
  installIosShareSteps: ['Touche le bouton Partager de ton navigateur', "Touche Sur l'écran d'accueil"],
  installAndroidSteps: ['Ouvre le menu du navigateur (trois points)', "Touche Ajouter à l'écran d'accueil ou Installer l'application"],
  installInAppTitle: 'Ouvre où dans ton navigateur',
  installInAppIos: "Impossible de l'installer depuis cette app. Ouvre la page dans Safari, puis ajoute-la à ton écran d'accueil.",
  installInAppAndroid: "Impossible de l'installer depuis cette app. Ouvre la page dans Chrome, puis ajoute-la à ton écran d'accueil.",
  installOpenChrome: 'Ouvrir dans Chrome',
  hint: (c: ConstraintNotMet) => {
    switch (c.type) {
      case 'max_beer_price':
        return c.actual === null
          ? 'Prix de la pinte inconnu'
          : `Pinte à ${amount(c.actual, 'fr')} € (demandé ≤ ${amount(c.requested, 'fr')} €)`
      case 'price_level':
        return c.actual === null
          ? `Plutôt ${level(c.requested, 'fr')} demandé, prix de la pinte inconnu`
          : `Plutôt ${level(c.requested, 'fr')} demandé, pinte à ${amount(c.actual, 'fr')} €`
      case 'opening':
        return c.requested === 'open now' ? 'Fermé en ce moment' : `Fermé à l'heure demandée (${clock(c.requested) ?? c.requested})`
      case 'happy_hour_opening': {
        const at = clock(c.requested)
        return at ? `Pas de happy hour à ${at}` : "Pas de happy hour à l'heure demandée"
      }
      case 'location':
        return `Loin de ${c.requested}`
      default:
        return traitHint(c, 'fr')
    }
  },
}

const drinkStrings: Record<Lang, typeof en> = { en, fr }

export type Strings = typeof en

const foodStrings: Record<Lang, typeof en> = {
  en: {
    ...en,
    eyebrow: 'Paris, today',
    tagline: "Let's find the best restaurant for you.",
    placeholder: 'What are you craving?',
    suggestions: [
      ['Ramen under 15 € near Bastille', 'Date-night Italian with a deal this week', 'Sunday lunch on a terrace in the Marais'],
      ['Late dinner after 11pm near metro 9', 'Veggie lunch close to Republique'],
    ],
    picks: (n: number) => n === 1 ? '1 restaurant for you' : `${n} restaurants for you`,
    exploreTitle: 'Top restaurants in view',
    exploreEmpty: 'No restaurant matches here',
    exploreLoading: 'Loading restaurants',
    exploreWarming: 'The restaurants are warming up, retrying.',
    exploreError: "Couldn't load the restaurants",
    barLoading: 'Loading the restaurant',
    barError: "Couldn't load this restaurant",
    barMissing: 'This restaurant is no longer listed.',
    more: 'Show more restaurants',
    moreError: "Couldn't load more restaurants",
    mapLabel: 'Map of restaurants in Paris',
    sheetLabel: 'Restaurant list',
  },
  fr: {
    ...fr,
    eyebrow: "Paris, aujourd'hui",
    tagline: 'Trouvons le meilleur restaurant pour toi.',
    placeholder: 'Envie de manger quoi ?',
    suggestions: [
      ['Des ramens à moins de 15 € vers Bastille', 'Un italien en amoureux avec un bon plan cette semaine', 'Un déjeuner du dimanche en terrasse dans le Marais'],
      ['Dîner tard après 23h sur la ligne 9', 'Un déjeuner végé près de République'],
    ],
    picks: (n: number) => n === 1 ? '1 restaurant pour toi' : `${n} restaurants pour toi`,
    exploreTitle: 'Les meilleurs restaurants ici',
    exploreEmpty: 'Aucun restaurant ne correspond ici',
    exploreLoading: 'Chargement des restaurants',
    exploreWarming: 'Les restaurants se réveillent, nouvelle tentative.',
    exploreError: 'Impossible de charger les restaurants',
    barLoading: 'Chargement du restaurant',
    barError: 'Impossible de charger ce restaurant',
    barMissing: "Ce restaurant n'est plus référencé.",
    more: "Voir plus d'adresses",
    moreError: "Impossible de charger plus d'adresses",
    mapLabel: 'Carte des restaurants à Paris',
    sheetLabel: 'Liste des restaurants',
  },
}

const danceStrings: Record<Lang, typeof en> = {
  en: {
    ...en,
    tagline: "Let's find where to dance tonight.",
    placeholder: 'What music tonight?',
    suggestions: [
      ['Hip-hop on Saturday', 'Techno till 6am, not too expensive', 'Queer party this weekend'],
      ['Afro and amapiano party tonight', 'A club that is easy to get into with a group'],
    ],
    picks: (n: number) => n === 1 ? '1 place to dance' : `${n} places to dance`,
    exploreTitle: 'Where to dance in view',
    exploreEmpty: 'No dance spot matches here',
    exploreLoading: 'Loading places to dance',
    exploreWarming: 'The clubs are warming up, retrying.',
    exploreError: "Couldn't load the clubs",
    barLoading: 'Loading the place',
    barError: "Couldn't load this place",
    barMissing: 'This place is no longer listed.',
    more: 'Show more places',
    moreError: "Couldn't load more places",
    mapLabel: 'Map of places to dance in Paris',
    sheetLabel: 'Places to dance',
  },
  fr: {
    ...fr,
    tagline: 'Trouvons où danser ce soir.',
    placeholder: 'Danser sur quoi ?',
    suggestions: [
      ['Du hip-hop samedi soir', "De la techno jusqu'à 6h, pas trop cher", 'Une soirée queer ce week-end'],
      ['Une soirée afro et amapiano ce soir', 'Un club où on rentre facilement en groupe'],
    ],
    picks: (n: number) => n === 1 ? '1 adresse pour danser' : `${n} adresses pour danser`,
    exploreTitle: 'Où danser par ici',
    exploreEmpty: 'Aucun lieu pour danser ici',
    exploreLoading: 'Chargement des lieux pour danser',
    exploreWarming: 'Les clubs se réveillent, nouvelle tentative.',
    exploreError: 'Impossible de charger les clubs',
    barLoading: 'Chargement du lieu',
    barError: 'Impossible de charger ce lieu',
    barMissing: "Ce lieu n'est plus référencé.",
    more: "Voir plus d'adresses",
    moreError: "Impossible de charger plus d'adresses",
    mapLabel: 'Carte des lieux pour danser à Paris',
    sheetLabel: 'Lieux pour danser',
  },
}

const coffeeStrings: Record<Lang, typeof en> = {
  en: {
    ...en,
    eyebrow: 'Paris, today',
    tagline: "Let's find the best coffee for you.",
    placeholder: 'Coffee, brunch, laptop?',
    suggestions: [
      ['Cozy coffee close to metro 14', 'Laptop-friendly cafe with plugs in the 10e', 'Best flat white near Canal Saint-Martin'],
      ['Quiet cafe open on Sunday', 'Matcha and pastries in the Marais'],
    ],
    picks: (n: number) => n === 1 ? '1 coffee spot for you' : `${n} coffee spots for you`,
    exploreTitle: 'Top coffee in view',
    exploreEmpty: 'No café matches here',
    exploreLoading: 'Loading cafés',
    exploreWarming: 'The cafés are warming up, retrying.',
    exploreError: "Couldn't load the cafés",
    barLoading: 'Loading the café',
    barError: "Couldn't load this café",
    barMissing: 'This café is no longer listed.',
    more: 'Show more cafés',
    moreError: "Couldn't load more cafés",
    menuCategories: { ...en.menuCategories, other: 'Coffee and more' },
    mapLabel: 'Map of cafés in Paris',
    sheetLabel: 'Café list',
  },
  fr: {
    ...fr,
    eyebrow: "Paris, aujourd'hui",
    tagline: 'Trouvons le meilleur café pour toi.',
    placeholder: 'Quelle pause café ?',
    suggestions: [
      ['Un café cosy près de la ligne 14', 'Un café où bosser avec des prises dans le 10e', 'Le meilleur flat white près du canal Saint-Martin'],
      ['Un café calme ouvert le dimanche', 'Matcha et pâtisseries dans le Marais'],
    ],
    picks: (n: number) => n === 1 ? '1 café pour toi' : `${n} cafés pour toi`,
    exploreTitle: 'Les meilleurs cafés ici',
    exploreEmpty: 'Aucun café ne correspond ici',
    exploreLoading: 'Chargement des cafés',
    exploreWarming: 'Les cafés se réveillent, nouvelle tentative.',
    exploreError: 'Impossible de charger les cafés',
    barLoading: 'Chargement du café',
    barError: 'Impossible de charger ce café',
    barMissing: "Ce café n'est plus référencé.",
    more: 'Voir plus de cafés',
    moreError: 'Impossible de charger plus de cafés',
    menuCategories: { ...fr.menuCategories, other: 'Cafés et autres' },
    mapLabel: 'Carte des cafés à Paris',
    sheetLabel: 'Liste des cafés',
  },
}

export const strings: Record<Layer, Record<Lang, typeof en>> = {
  drink: drinkStrings,
  eat: foodStrings,
  dance: danceStrings,
  coffee: coffeeStrings,
}

const cuisinesFr: Record<string, string> = {
  french: 'Français', italian: 'Italien', japanese: 'Japonais', chinese: 'Chinois', middle_eastern: 'Moyen-Orient',
  korean: 'Coréen', indian: 'Indien', vietnamese: 'Vietnamien', african: 'Africain', thai: 'Thaï', lebanese: 'Libanais',
  mexican: 'Mexicain', greek: 'Grec', spanish: 'Espagnol', peruvian: 'Péruvien', american: 'Américain', turkish: 'Turc',
  moroccan: 'Marocain', georgian: 'Géorgien', ethiopian: 'Éthiopien', israeli: 'Israélien', portuguese: 'Portugais',
}

export function cuisineLabel(c: string, lang: Lang) {
  if (lang === 'fr' && cuisinesFr[c]) return cuisinesFr[c]
  const words = c.replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function hintFor(list: ConstraintNotMet[], t: typeof en) {
  return list.slice(0, 2).map(t.hint).join(' · ')
}

export const LangContext = createContext<Lang>('en')

export function useLang() {
  return useContext(LangContext)
}

export function useT() {
  return strings[useLayer()][useLang()]
}

export function initialLang(): Lang {
  const asked = new URLSearchParams(location.search).get('lang')
  if (asked === 'en' || asked === 'fr') return asked
  return (navigator.language ?? '').toLowerCase().startsWith('fr') ? 'fr' : 'en'
}
