'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useSupabase } from './use-supabase-actions'

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = getSupabaseClient()
    const { updateUserStatus } = useSupabase()

    const getUser = useCallback(async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) throw new Error('Not authenticated');
        return user;
    }, [supabase]);

    const login = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        try {
            setIsLoading(true)
            const formData = new FormData(event.currentTarget)
            const { error } = await supabase.auth.signInWithPassword({
                email: formData.get('email') as string,
                password: formData.get('password') as string,
            })

            if (error) throw error
            await updateUserStatus('online')

            router.refresh()
            router.push('/')
        } catch (error) {
            console.error('Login error:', error)
            router.push('/error')
        } finally {
            setIsLoading(false)
        }
    }

    const signup = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        try {
            setIsLoading(true)
            const formData = new FormData(event.currentTarget)
            const { data: { user }, error } = await supabase.auth.signUp({
                email: formData.get('email') as string,
                password: formData.get('password') as string,
                options: {
                    data: {
                        username: formData.get('username') as string
                    }
                }
            })

            if (error) throw error

            // if (user) {
            //     await supabase.from('users').update({
            //         username: formData.get('username') as string
            //     }).eq('id', user.id)
            // }

            router.refresh()
            router.push('/')
        } catch (error) {
            console.error('Signup error:', error)
            router.push('/error')
        } finally {
            setIsLoading(false)
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    return {
        login,
        signup,
        isLoading,
        getUser,
        signOut
    }
}