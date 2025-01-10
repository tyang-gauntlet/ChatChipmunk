'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = getSupabaseClient()

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
            const { error } = await supabase.auth.signUp({
                email: formData.get('email') as string,
                password: formData.get('password') as string,
            })

            if (error) throw error

            router.refresh()
            router.push('/')
        } catch (error) {
            console.error('Signup error:', error)
            router.push('/error')
        } finally {
            setIsLoading(false)
        }
    }

    return {
        login,
        signup,
        isLoading
    }
}