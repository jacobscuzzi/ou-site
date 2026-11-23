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
    ['A bar to watch the PSG game', 'A bar close by that is fun to go to alone', 'A bar for LGBTQ people', 'A bar that feels super safe'],
    ['A fancy bar with espresso martinis', 'A student bar with cheap beer and great atmosphere', 'A quiet wine bar for a first date', 'Somewhere with live jazz tonight'],
    ['A rooftop with a view for sunset', 'A bar with a big terrace in the 11e', 'A cocktail bar that stays open past 3', 'A pub with a quiz and cheap pints'],
  ],
  thinking: 'Running the numbers',
  picks: (n: number) => `${n} picks for tonight`,
  openTill: (t: string) => `Open today till ${t}`,
  till: (t: string) => `Till ${t}`,
  chipOpen: 'Open now',
  chipTerrace: 'Terrace',
  chipDancing: 'People dance',
  chipCheap: (n: number) => `Pint under ${n} EUR`,
  chipsLabel: 'Filters',
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
  perPerson: (p: string) => `${p} per person`,
  coffeePrice: (p: string) => `Coffee ${p}`,
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
  sheetHandle: { peek: 'Panel collapsed, raise it', half: 'Panel half open, raise it', full: 'Panel fully open, lower it' },
  backToMap: 'Back to the map',
  searchHere: 'Search this area',
  postsTitle: 'On TikTok',
  postLabel: (author: string, kind: 'video' | 'photo') => `${kind === 'photo' ? 'Photos' : 'Video'} by @${author} on TikTok`,
  playerNote: 'This loads content and cookies from TikTok.',
  openTikTok: 'Open on TikTok',
  close: 'Close',
  layerMenu: (name: string) => `Showing ${name}, change`,
  layerNames: { drink: 'Drinks', eat: 'Food', dance: 'Dancing', coffee: 'Coffee' } as Record<Layer, string>,
  layerSwitched: (name: string) => `Showing ${name} for this search`,
  installTitle: 'Add où to your home screen',
  installText: 'It opens like an app, straight on the map.',
  installAction: 'Install',
  installClose: 'Not now',
  installIosSteps: ['Tap the three-dot button next to the address bar', 'Tap Share', 'Tap Add to Home Screen'],
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
    ['Un bar pour regarder le match du PSG', 'Un bar sympa tout près pour y aller seul', 'Un bar pour les personnes LGBTQ', 'Un bar où on se sent en sécurité'],
    ['Un bar chic avec des espresso martinis', 'Un bar étudiant, bière pas chère et bonne ambiance', 'Un bar à vin calme pour un premier rendez-vous', 'Du jazz en live ce soir'],
    ['Un rooftop avec vue pour le coucher du soleil', 'Un bar avec une grande terrasse dans le 11e', 'Un bar à cocktails ouvert après 3h', 'Un pub avec un quiz et des pintes pas chères'],
  ],
  thinking: 'On fait les comptes',
  picks: (n: number) => `${n} adresses pour ce soir`,
  openTill: (t: string) => `Ouvert ce soir jusqu'à ${t}`,
  till: (t: string) => `Jusqu'à ${t}`,
  chipOpen: 'Ouvert',
  chipTerrace: 'Terrasse',
  chipDancing: 'On danse',
  chipCheap: (n: number) => `Pinte sous ${n} EUR`,
  chipsLabel: 'Filtres',
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
  perPerson: (p: string) => `${p} par personne`,
  coffeePrice: (p: string) => `Café ${p}`,
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
  sheetHandle: { peek: 'Panneau réduit, le monter', half: 'Panneau à moitié ouvert, le monter', full: 'Panneau ouvert, le descendre' },
  backToMap: 'Revenir à la carte',
  searchHere: 'Rechercher ici',
  postsTitle: 'Sur TikTok',
  postLabel: (author: string, kind: 'video' | 'photo') => `${kind === 'photo' ? 'Photos' : 'Vidéo'} de @${author} sur TikTok`,
  playerNote: 'Ceci charge du contenu et des cookies de TikTok.',
  openTikTok: 'Ouvrir sur TikTok',
  close: 'Fermer',
  layerMenu: (name: string) => `${name} affiché, changer`,
  layerNames: { drink: 'Boire un verre', eat: 'Manger', dance: 'Danser', coffee: 'Café' },
  layerSwitched: (name: string) => `${name} affiché pour cette recherche`,
  installTitle: "Ajoute où à ton écran d'accueil",
  installText: "Il s'ouvre comme une app, directement sur la carte.",
  installAction: 'Installer',
  installClose: 'Plus tard',
  installIosSteps: ["Touche le bouton à trois points à côté de la barre d'adresse", 'Touche Partager', "Touche Sur l'écran d'accueil"],
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
      ['A cheap Lebanese place in the 10e', 'Good ramen near Bastille', 'A romantic dinner with a view', 'Brunch on Sunday'],
      ['A Neapolitan pizza in the 11e', 'Dinner for under 20 EUR', 'A bistro for a group of friends', 'A vegetarian restaurant'],
      ['Dim sum in the 13e', 'A French bistro with a terrace', 'A place for a quick lunch', 'The best burger in Paris'],
    ],
    picks: (n: number) => `${n} restaurants for you`,
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
      ['Un libanais pas cher dans le 10e', 'De bons ramen vers Bastille', 'Un dîner romantique avec vue', 'Un brunch le dimanche'],
      ['Une pizza napolitaine dans le 11e', 'Dîner pour moins de 20 €', 'Un bistrot pour un groupe d’amis', 'Un restaurant végétarien'],
      ['Des dim sum dans le 13e', 'Un bistrot français avec terrasse', 'Un endroit pour déjeuner vite', 'Le meilleur burger de Paris'],
    ],
    picks: (n: number) => `${n} restaurants pour toi`,
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
      ['A techno club open until sunrise', 'Somewhere to dance to hip-hop tonight', 'A queer party in the Marais', 'A club with no dress code'],
      ['Disco and house with a mixed crowd', 'A free club in the 11e', 'Latin music to dance salsa', 'A bar where people dance on the tables'],
      ['An afro night on Saturday', 'A rock club with live bands', 'A small club near Pigalle', 'Dancing after 2am, cheap drinks'],
    ],
    picks: (n: number) => `${n} places to dance`,
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
      ["Un club techno ouvert jusqu'au lever du soleil", 'Danser sur du hip-hop ce soir', 'Une soirée queer dans le Marais', 'Un club sans dress code'],
      ['Disco et house avec un public mixte', 'Un club gratuit dans le 11e', 'De la musique latine pour danser la salsa', 'Un bar où on danse sur les tables'],
      ['Une soirée afro samedi', 'Un club rock avec des concerts', 'Un petit club vers Pigalle', 'Danser après 2h, verres pas chers'],
    ],
    picks: (n: number) => `${n} adresses pour danser`,
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
      ['Specialty coffee near République', 'A café to work on my laptop', 'Brunch on Sunday morning', 'A quiet café to read'],
      ['A flat white under 4 EUR', 'A coffee shop with a terrace', 'Good pastries with my coffee', 'A café open early near Bastille'],
      ['A tea room in the Marais', 'Somewhere cosy on a rainy day', 'A bakery with seats', 'A coffee roaster to buy beans'],
    ],
    picks: (n: number) => `${n} coffee spots for you`,
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
      ['Un café de spécialité vers République', 'Un café pour bosser sur mon ordi', 'Un brunch le dimanche matin', 'Un café calme pour lire'],
      ['Un flat white à moins de 4 €', 'Un coffee shop avec terrasse', 'De bonnes viennoiseries avec le café', 'Un café ouvert tôt vers Bastille'],
      ['Un salon de thé dans le Marais', 'Un endroit cosy un jour de pluie', 'Une boulangerie où s’asseoir', 'Un torréfacteur pour acheter du café'],
    ],
    picks: (n: number) => `${n} cafés pour toi`,
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
