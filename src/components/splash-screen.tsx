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
      className={`fixed inset-0 z-100 flex flex-col items-center justify-center bg-(--bg-base) transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* PayLink branding */}
      <img
        src="/paylink-light.png"
        alt="PayLink"
        className="h-20 w-auto object-contain drop-shadow-[0_6px_18px_rgba(30,90,72,0.18)] rounded-full"
      />
      <p className="mt-3 text-xs text-(--sea-ink-soft)">On-chain billing for MiniPay</p>

      {/* Loading indicator */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="flex gap-1.5">
          <span className="size-2 rounded-full bg-(--lagoon) animate-bounce [animation-delay:0ms]" />
          <span className="size-2 rounded-full bg-(--lagoon) animate-bounce [animation-delay:150ms]" />
          <span className="size-2 rounded-full bg-(--lagoon) animate-bounce [animation-delay:300ms]" />
        </div>
        <p className="text-xs text-(--sea-ink-soft)">
          {isReady ? 'Ready' : 'Connecting wallet...'}
        </p>
      </div>
    </div>
  )
}
