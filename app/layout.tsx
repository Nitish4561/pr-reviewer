import type { Metadata } from 'next'
import './globals.css'

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
      <body>
        {children}
      </body>
    </html>
  )
}

