import { useT } from '../i18n'
import { danceKind } from '../kind'
import { useLayer } from '../mode'

export default function KindBadge({ kinds }: { kinds: string[] | undefined }) {
  const t = useT()
  const kind = danceKind(kinds, useLayer())
  if (!kind) return null
  return <span className={`kind kind-${kind}`}>{t.danceKinds[kind]}</span>
}
