"use client"

import { DBUser } from "@/lib/types"
import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/hooks/use-supabase-actions"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

interface DirectMessageListProps {
    onUserSelect: (user: DBUser) => void
}

export const DirectMessageList = ({ onUserSelect }: DirectMessageListProps) => {
    const [users, setUsers] = useState<DBUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { getUsers } = useSupabase()

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const users = await getUsers()
                setUsers(users)
            } catch (error) {
                console.error('Failed to fetch users:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchUsers()
    }, [])

    if (isLoading) {
        return <div className="px-4 py-2 text-sm text-muted-foreground">Loading...</div>
    }

    if (!users.length) {
        return <div className="px-4 py-2 text-sm text-muted-foreground">No users found</div>
    }

    return (
        <div className="space-y-[2px]">
            {users.map((user) => (
                <button
                    key={user.id}
                    onClick={() => onUserSelect(user)}
                    className="w-full flex items-center gap-2 px-4 py-1.5 hover:bg-accent rounded-md"
                >
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>
                            {user.email?.[0].toUpperCase() || ''}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate">
                        {user.email}
                    </span>
                </button>
            ))}
        </div>
    )
} 