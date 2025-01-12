"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from '@/hooks/use-auth'
import { useSupabase } from "@/hooks/use-supabase-actions"

export function UserNav() {
    const [userInitial, setUserInitial] = useState("")
    const router = useRouter()
    const { signOut } = useAuth()
    const { getPublicUser, updateUserStatus } = useSupabase()

    useEffect(() => {
        const getUsername = async () => {
            const user = await getPublicUser()
            if (user?.username) {
                setUserInitial(user.username.toUpperCase()[0])
            }
        }
        getUsername()
    }, [])

    const handleLogout = async () => {
        try {
            await updateUserStatus('offline')
            await signOut()
            router.push('/login')
        } catch (error) {
            console.error('Error during logout:', error)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background">
                <DropdownMenuItem onClick={handleLogout} className="bg-background hover:bg-accent">
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
} 