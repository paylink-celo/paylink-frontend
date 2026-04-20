import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import ChatDrawer from '../components/ChatDrawer'
import Footer from '../components/Footer'
import Header from '../components/Header'
import Providers from '../components/Providers'

import appCss from '../styles.css?url'

function NotFound() {
  return (
    <main className="page-wrap flex flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="text-6xl">🔍</span>
      <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Page not found</h1>
      <p className="text-[var(--sub)]">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary mt-2">
        Back to Home
      </Link>
    </main>
  )
}

export const Route = createRootRoute({
  notFoundComponent: NotFound,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'theme-color', content: '#eef7f1' },
      { title: 'PayLink \u2014 On-chain billing for MiniPay' },
      {
        name: 'description',
        content:
          'Create invoices, send payment requests, and get paid in cUSD/USDT on Celo. Built for MiniPay.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
        <Providers>
          <Header />
          {children}
          <Footer />
          <ChatDrawer />
        </Providers>
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
