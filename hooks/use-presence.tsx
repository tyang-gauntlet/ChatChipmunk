"use client"

import { useEffect } from 'react'
import { useSupabase } from './use-supabase-actions'
import { getSupabaseClient } from '@/lib/supabase/client'

export const usePresence = () => {
    const { updateUserStatus, getPublicUser } = useSupabase()
    const supabase = getSupabaseClient()

    useEffect(() => {
        let presenceChannel: ReturnType<typeof supabase.channel>

        const setupPresence = async () => {
            const user = await getPublicUser()
            if (!user) return

            // Set initial online status
            await updateUserStatus('online')

            // Setup presence channel
            presenceChannel = supabase.channel('online_users')
                .on('presence', { event: 'sync' }, () => {
                    console.log('Presence sync:', presenceChannel.presenceState())
                })
                .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                    console.log('User joined:', key, newPresences)
                })
                .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                    console.log('User left:', key, leftPresences)
                })

            await presenceChannel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({
                        user_id: user.id,
                        online_at: new Date().toISOString(),
                    })
                }
            })
        }

        setupPresence()

        // Handle visibility change
        const handleVisibilityChange = () => {
            updateUserStatus(document.visibilityState === 'visible' ? 'online' : 'offline')
        }

        // Handle before unload
        const handleBeforeUnload = () => {
            updateUserStatus('offline')
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('beforeunload', handleBeforeUnload)
            if (presenceChannel) {
                presenceChannel.unsubscribe()
            }
            updateUserStatus('offline')
        }
    }, [updateUserStatus, getPublicUser])
} 