import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Slide AI',
  description: 'AI-powered slide viewer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning style={{ margin: 0, padding: 0, overflow: 'hidden', width: '100vw', height: '100vh' }}>
        {children}
      </body>
    </html>
  )
}