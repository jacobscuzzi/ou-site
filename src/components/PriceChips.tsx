import { dishWord } from '../dish'
import { useT } from '../i18n'
import { price } from '../price'
import { CupIcon, PlateIcon } from './icons'

export function Espresso({ value }: { value: number }) {
  const t = useT()
  return (
    <span className="chip chip-pink">
      <span className="chip-icon"><CupIcon /></span>
      {t.coffeePrice(price(value))}
    </span>
  )
}

export function Dish({ value, kinds }: { value: number; kinds: string[] }) {
  const t = useT()
  return (
    <span className="chip chip-pink">
      <span className="chip-icon"><PlateIcon /></span>
      {t.dishPrice[dishWord(kinds)]} {price(value)}
    </span>
  )
}
