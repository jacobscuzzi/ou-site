import type { Lang } from '../i18n'
import './LangSwitch.css'

const langs: Lang[] = ['fr', 'en']

export default function LangSwitch({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="lang" role="group" aria-label="Language">
      {langs.map((l) => (
        <button
          key={l}
          type="button"
          className={l === lang ? 'lang-option lang-active' : 'lang-option'}
          aria-pressed={l === lang}
          onClick={() => onChange(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
