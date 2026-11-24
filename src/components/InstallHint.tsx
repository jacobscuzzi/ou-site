import { useEffect, useState } from 'react'
import { useT } from '../i18n'
import { chromeIntent, dismissedRecently, dismissInstall, installKind, isAndroid, isPhone, onInstallChange, promptInstall, visits } from '../install'
import './InstallHint.css'

const FIRST_VISIT_DELAY = 4000

export default function InstallHint({ placeOpened }: { placeOpened: boolean }) {
  const t = useT()
  const [kind, setKind] = useState(installKind)
  const [closed, setClosed] = useState(dismissedRecently)

  const [waited, setWaited] = useState(false)

  useEffect(() => onInstallChange(() => setKind(installKind())), [])

  useEffect(() => {
    if (!isPhone) return
    const timer = window.setTimeout(() => setWaited(true), FIRST_VISIT_DELAY)
    return () => window.clearTimeout(timer)
  }, [])

  if (!kind || closed || !(placeOpened || visits >= 2 || waited)) return null

  function close() {
    dismissInstall()
    setClosed(true)
  }

  async function install() {
    const accepted = await promptInstall()
    if (!accepted) dismissInstall()
    setClosed(true)
  }

  const inApp = kind === 'in-app'
  const steps = { ios: t.installIosSteps, 'ios-share': t.installIosShareSteps, android: t.installAndroidSteps, prompt: null, 'in-app': null }[kind]
  return (
    <aside className="install" role="dialog" aria-labelledby="install-title">
      <img className="install-icon" src="/icon-192.png" alt="" width={44} height={44} />
      <div className="install-body">
        <h2 id="install-title" className="install-title">
          {inApp ? t.installInAppTitle : t.installTitle}
        </h2>
        {kind === 'prompt' && <p className="install-text">{t.installText}</p>}
        {steps && (
          <ol className="install-steps">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}
        {inApp && <p className="install-text">{isAndroid ? t.installInAppAndroid : t.installInAppIos}</p>}
        <div className="install-actions">
          {kind === 'prompt' && (
            <button type="button" className="install-primary" onClick={install}>
              {t.installAction}
            </button>
          )}
          {inApp && isAndroid && (
            <a className="install-primary" href={chromeIntent()}>
              {t.installOpenChrome}
            </a>
          )}
          <button type="button" className="install-close" onClick={close}>
            {t.installClose}
          </button>
        </div>
      </div>
    </aside>
  )
}
