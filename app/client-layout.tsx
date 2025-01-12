"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { usePresence } from "@/hooks/use-presence"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    usePresence() // Use the presence hook

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
    )
} 