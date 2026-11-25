import { useEffect, useRef, useState } from 'react'
import { postReport } from '../api/client'
import { useBackClose } from '../backClose'
import { useT } from '../i18n'
import { toast } from '../toast'
import { CloseIcon } from './icons'
import './ReportSheet.css'

type Props = { placeId?: string; eventId?: string; title: string; context: Record<string, unknown>; onClose: () => void }

export default function ReportSheet({ placeId, eventId, title, context, onClose }: Props) {
  const t = useT()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(false)
  const field = useRef<HTMLTextAreaElement>(null)
  useBackClose(onClose)

  useEffect(() => {
    field.current?.focus({ preventScroll: true })
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])

  async function send() {
    if (text.trim().length < 3 || sending) return
    setSending(true)
    setError(false)
    try {
      await postReport({ placeId, eventId, message: text.trim(), context })
      toast(t.reportThanks)
      onClose()
    } catch {
      setError(true)
      setSending(false)
    }
  }

  return (
    <div className="report-scrim" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        className="report"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-q"
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
      >
        <header className="report-head">
          <div>
            <h2 className="report-q" id="report-q">
              {t.reportQuestion}
            </h2>
            <p className="report-about">{title}</p>
          </div>
          <button type="button" className="report-close" aria-label={t.close} onClick={onClose}>
            <CloseIcon />
          </button>
        </header>
        <textarea
          ref={field}
          className="report-text"
          value={text}
          maxLength={600}
          rows={4}
          placeholder={t.reportPlaceholder}
          onChange={(e) => setText(e.target.value)}
        />
        {error && (
          <p className="report-error" role="alert">
            {t.reportFailed}
          </p>
        )}
        <button type="submit" className="btn-primary report-send" disabled={text.trim().length < 3 || sending}>
          {t.reportSend}
        </button>
      </form>
    </div>
  )
}
