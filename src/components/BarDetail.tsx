import type { Bar } from '../api/types'
import { useLang, useT } from '../i18n'
import { price } from '../price'
import { CocktailIcon, PinIcon } from './icons'
import Menu from './Menu'
import './BarDetail.css'

function hour(t: string) {
  const [h, m] = t.split(':')
  return m === '00' ? `${h}h` : `${h}h${m}`
}

export default function BarDetail({ bar, open }: { bar: Bar; open: boolean }) {
  const t = useT()
  const lang = useLang()

  return (
    <div className={open ? 'detail-wrap detail-open' : 'detail-wrap'} aria-hidden={!open}>
      <div className="detail">
        <p className="detail-why">
          <strong>{t.whyHere} </strong>
          {bar.description?.[lang] ?? bar.whyHere}
        </p>
        {bar.happyHour && (
          <div className="detail-chips">
            <span className="chip">
              <span className="chip-icon"><CocktailIcon /></span>
              {t.happyHour(hour(bar.happyHour.from), hour(bar.happyHour.to))}
              {bar.happyHour.pintPrice !== null && <span className="chip-amount">{price(bar.happyHour.pintPrice)}</span>}
            </span>
          </div>
        )}
        <Menu items={bar.menu} focusable={open} />
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
