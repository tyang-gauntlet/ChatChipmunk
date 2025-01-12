"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { UserPresence } from '@/components/user-presence'
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()
    const supabase = getSupabaseClient()

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()
                if (error) throw error

                if (!session && pathname !== '/login') {
                    router.push('/login')
                    return
                }

                if (session && pathname === '/login') {
                    router.push('/')
                    return
                }

            } catch (error) {
                console.error('Auth check error:', error)
                router.push('/login')
            } finally {
                setIsLoading(false)
            }
        }

        checkAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                router.push('/login')
            }
        })

        return () => subscription.unsubscribe()
    }, [router, supabase, pathname])

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <>
            <UserPresence />
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                {children}
            </ThemeProvider>
        </>
    )
} 