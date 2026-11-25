import type { Bar } from '../api/types'
import { useLang, useT } from '../i18n'
import { useLayer } from '../mode'
import { price } from '../price'
import { CocktailIcon, PinIcon } from './icons'
import Dishes from './Dishes'
import Menu from './Menu'
import Photo from './Photo'
import Actions from './Actions'
import EventCard from './EventCard'
import './BarDetail.css'

function hour(t: string) {
  const [h, m] = t.split(':')
  return m === '00' ? `${h}h` : `${h}h${m}`
}

export default function BarDetail({ bar, open }: { bar: Bar; open: boolean }) {
  const t = useT()
  const lang = useLang()
  const eat = useLayer() === 'eat'

  return (
    <div className={open ? 'detail-wrap detail-open' : 'detail-wrap'} aria-hidden={!open}>
      <div className="detail">
        <p className="detail-why">
          <strong>{t.whyHere} </strong>
          {bar.description?.[lang] ?? bar.whyHere}
        </p>
        {eat && bar.photos.length > 1 && (
          <div className="detail-photos">
            {bar.photos.slice(1).map((src) => (
              <Photo key={src} className="detail-photo" src={src} />
            ))}
          </div>
        )}
        {(bar.events ?? []).length > 0 && (
          <section className="detail-events">
            <h3 className="menu-title">{t.nextEvents}</h3>
            {bar.events.map((e) => (
              <EventCard key={e.id} event={e} kinds={bar.kinds} showPlace={false} focusable={open} />
            ))}
          </section>
        )}
        {bar.happyHour && (
          <div className="detail-chips">
            <span className="chip">
              <span className="chip-icon"><CocktailIcon /></span>
              {t.happyHour(hour(bar.happyHour.from), hour(bar.happyHour.to))}
              {bar.happyHour.pintPrice !== null && <span className="chip-amount">{price(bar.happyHour.pintPrice)}</span>}
            </span>
          </div>
        )}
        {eat ? <Dishes dishes={bar.dishes ?? []} focusable={open} /> : <Menu items={bar.menu} focusable={open} />}
        <Actions actions={(bar.actions ?? []).slice(1)} kinds={bar.kinds} focusable={open} />
        <div className="detail-foot">
          <span className="detail-address">
            <PinIcon />
            {bar.address}
          </span>
          <a
            className="btn-primary"
            href={bar.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={open ? 0 : -1}
            onClick={(e) => e.stopPropagation()}
          >
            {t.openMaps}
          </a>
        </div>
      </div>
    </div>
  )
}
