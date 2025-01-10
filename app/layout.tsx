import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { UserPresence } from '@/components/user-presence'

export const metadata = {
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
      <body>
        <UserPresence />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
