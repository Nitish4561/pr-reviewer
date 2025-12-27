import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PR Reviewer',
  description: 'AI-powered pull request reviews',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}

