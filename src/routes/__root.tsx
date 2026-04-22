import { createRootRoute } from '@tanstack/react-router'
import Providers from '@/providers/providers'
import { useAutoConnect } from '@/hooks/use-auto-connect'
import { MobileLayout } from '@/components/layout/mobile-layout'
import { SplashScreen } from '@/components/splash-screen'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <Providers>
      <AppShell />
    </Providers>
  )
}

function AppShell() {
  const { hasAttempted } = useAutoConnect()

  return (
    <>
      <SplashScreen isReady={hasAttempted} />
      <MobileLayout />
    </>
  )
}
