"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import { PropsWithChildren, useState } from 'react'
import SupabaseProvider from './supabase-provider'

export function Providers({ children }: PropsWithChildren) {
    const [queryClient] = useState(() => new QueryClient())

    return (
        <SupabaseProvider>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                    <Toaster />
                </ThemeProvider>
            </QueryClientProvider>
        </SupabaseProvider>
    )
} 