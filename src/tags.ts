import type { Bar } from './api/types'
import type { Lang } from './i18n'

type Rule = { re: RegExp; en: string; fr: string; emoji: string }

const rules: Rule[] = [
  { re: /\bdarts?\b|fléchettes/, en: 'Darts', fr: 'Fléchettes', emoji: '🎯' },
  { re: /billiard|pool table|snooker/, en: 'Billiards', fr: 'Billard', emoji: '🎱' },
  { re: /live music|live band|live sets?|live jazz|concert|jam session/, en: 'Live music', fr: 'Musique live', emoji: '🎸' },
  { re: /\bdjs?\b|dancefloor|dance bar|night ?club|basement club|boîte/, en: 'DJ', fr: 'DJ', emoji: '🎧' },
  { re: /lgbt|queer|\bgay\b|lesbi|flinta/, en: 'Queer', fr: 'Queer', emoji: '🏳️‍🌈' },
  { re: /feminist|féministe|run by (three |two )?women/, en: 'Feminist', fr: 'Féministe', emoji: '♀️' },
  { re: /board.?games?|jeux de société|game bar|bar à jeux|game masters/, en: 'Board games', fr: 'Jeux de société', emoji: '🎲' },
  { re: /\bdrag\b|burlesque|cabaret|\bshows?\b|go-go/, en: 'Shows', fr: 'Spectacles', emoji: '🎭' },
  { re: /dance floor|dancefloor|swing|dancing|tea dance/, en: 'Dancing', fr: 'Danse', emoji: '💃' },
  { re: /cellar|vaulted|\bcave\b|caveau/, en: 'Cellar', fr: 'Cave', emoji: '🕯️' },
  { re: /student|étudiant/, en: 'Students', fr: 'Étudiants', emoji: '🎓' },
  { re: /after ?work/, en: 'Afterwork', fr: 'Afterwork', emoji: '💼' },
  { re: /international|expat|erasmus/, en: 'Internationals', fr: 'Internationaux', emoji: '🌍' },
  { re: /karaoke|karaoké/, en: 'Karaoke', fr: 'Karaoké', emoji: '🎤' },
  { re: /beer pong/, en: 'Beer pong', fr: 'Beer pong', emoji: '🏓' },
  { re: /table football|foosball|baby-?foot|kicker/, en: 'Table football', fr: 'Baby-foot', emoji: '⚽' },
  { re: /arcade|pinball|flipper/, en: 'Arcade', fr: 'Arcade', emoji: '🕹️' },
  { re: /terrace|terrasse/, en: 'Terrace', fr: 'Terrasse', emoji: '☀️' },
  { re: /match|sport|big screen|screens\b|grand écran/, en: 'Match nights', fr: 'Soirs de match', emoji: '📺' },
  { re: /\brock\b/, en: 'Rock', fr: 'Rock', emoji: '🤘' },
  { re: /jazz/, en: 'Jazz', fr: 'Jazz', emoji: '🎷' },
  { re: /cocktail/, en: 'Cocktails', fr: 'Cocktails', emoji: '🍸' },
  { re: /\bwine\b|\bvin\b/, en: 'Wine', fr: 'Vin', emoji: '🍷' },
  { re: /quiz/, en: 'Quiz', fr: 'Quiz', emoji: '🧠' },
  { re: /party|dancing|fête/, en: 'Party', fr: 'Fête', emoji: '🎉' },
  { re: /rooftop/, en: 'Rooftop', fr: 'Rooftop', emoji: '🌇' },
  { re: /burger|pizza|kitchen|\bfood\b/, en: 'Food', fr: 'À manger', emoji: '🍔' },
  { re: /cosy|cozy|relaxed|quiet|calm/, en: 'Cosy', fr: 'Cosy', emoji: '🛋️' },
  { re: /neighbourhood|neighborhood|local bar|corner cafe|de quartier/, en: 'Local', fr: 'De quartier', emoji: '🏘️' },
  { re: /on tap|craft beer/, en: 'Beers on tap', fr: 'Bières pression', emoji: '🍺' },
  { re: /busy|crowd|packed|lively|animé/, en: 'Lively', fr: 'Animé', emoji: '🔥' },
]

export type Tag = { label: string; emoji: string }

export function tagsFor(bar: Bar, lang: Lang, max = 3): Tag[] {
  const text = `${bar.name} ${bar.whyHere}`.toLowerCase()
  return rules
    .filter((r) => r.re.test(text))
    .slice(0, max)
    .map((r) => ({ label: r[lang], emoji: r.emoji }))
}
