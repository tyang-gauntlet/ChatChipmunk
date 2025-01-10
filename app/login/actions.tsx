'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const login = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            setIsLoading(true)
            const formData = new FormData(e.currentTarget)
            const data = {
                email: formData.get('email') as string,
                password: formData.get('password') as string,
            }

            const { error } = await supabase.auth.signInWithPassword(data)

            if (error) {
                throw error
            }

            router.refresh()
            router.push('/')
        } catch (error) {
            router.push('/error')
        } finally {
            setIsLoading(false)
        }
    }

    const signup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            setIsLoading(true)
            const formData = new FormData(e.currentTarget)
            const data = {
                email: formData.get('email') as string,
                password: formData.get('password') as string,
            }

            const { error } = await supabase.auth.signUp(data)

            if (error) {
                throw error
            }

            router.refresh()
            router.push('/')
        } catch (error) {
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