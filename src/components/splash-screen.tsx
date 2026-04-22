import { useEffect, useState } from 'react'

interface SplashScreenProps {
  isReady: boolean
}

const SPLASH_KEY = 'paylink-splash-shown'

export function SplashScreen({ isReady }: SplashScreenProps) {
  const alreadyShown = sessionStorage.getItem(SPLASH_KEY) === '1'
  const [show, setShow] = useState(!alreadyShown)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    if (!isReady || !show) return

    const minDisplayTimer = setTimeout(() => {
      setFadeOut(true)
      const removeTimer = setTimeout(() => {
        setShow(false)
        sessionStorage.setItem(SPLASH_KEY, '1')
      }, 500)
      return () => clearTimeout(removeTimer)
    }, 1200)

    return () => clearTimeout(minDisplayTimer)
  }, [isReady, show])

  if (!show) return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--bg-base)] transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      PayLink branding
      <div className="flex items-center gap-3">
        <span className="h-4 w-4 rounded-full bg-[linear-gradient(90deg,#38A191,#B2DFDB)]" />
        <span className="text-2xl font-bold text-[var(--sea-ink)]">PayLink</span>
      </div>
      <p className="mt-2 text-xs text-[var(--sea-ink-soft)]">On-chain billing for MiniPay</p>

      {/* Loading indicator */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="flex gap-1.5">
          <span className="size-2 rounded-full bg-[var(--lagoon)] animate-bounce [animation-delay:0ms]" />
          <span className="size-2 rounded-full bg-[var(--lagoon)] animate-bounce [animation-delay:150ms]" />
          <span className="size-2 rounded-full bg-[var(--lagoon)] animate-bounce [animation-delay:300ms]" />
        </div>
        <p className="text-xs text-[var(--sea-ink-soft)]">
          {isReady ? 'Ready' : 'Connecting wallet...'}
        </p>
      </div>
    </div>
  )
}
