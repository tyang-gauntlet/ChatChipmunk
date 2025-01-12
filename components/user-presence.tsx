"use client"

import { useEffect, useCallback } from 'react'
import { useSupabase } from '../hooks/use-supabase-actions'

export const UserPresence = () => {
    const { getPublicUser, updateUserStatus } = useSupabase()

    const updateLastSeen = useCallback(async () => {
        try {
            const user = await getPublicUser()
            if (!user) return
            await updateUserStatus('online')
        } catch (error) {
            console.error('Failed to update last_seen:', error)
        }
    }, [getPublicUser, updateUserStatus])

    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                updateLastSeen()
            }
        }, 15000)

        // Initial update
        updateLastSeen()

        // Cleanup
        return () => clearInterval(interval)
    }, [updateLastSeen])

    // Handle visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                updateLastSeen()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [updateLastSeen])

    return null
} 