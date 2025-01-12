import { Metadata } from 'next'
import ClientLayout from './client-layout'
import "./globals.css"

export const metadata: Metadata = {
  title: 'ChatChipmunk',
  description: 'Real-time chat application',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
