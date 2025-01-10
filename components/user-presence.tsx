"use client"

import { useEffect } from 'react'
import { useSupabase } from '@/lib/hooks/use-supabase-actions'

export const UserPresence = () => {
    const { supabase } = useSupabase()

    useEffect(() => {
        let interval: NodeJS.Timeout

        const updateLastSeen = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                await supabase
                    .from('users')
                    .update({ last_seen: new Date().toISOString() })
                    .eq('id', user.id)
            } catch (error) {
                console.error('Failed to update last_seen:', error)
            }
        }

        // Update immediately
        updateLastSeen()

        // Update every 15 seconds when tab is visible
        interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                updateLastSeen()
            }
        }, 15000)

        return () => clearInterval(interval)
    }, [supabase])

    return null
} 