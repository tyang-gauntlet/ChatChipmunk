"use client"

import { DBUser } from "@/lib/types"
import { useEffect, useState, useMemo } from "react"
import { useSupabase } from "@/lib/hooks/use-supabase-actions"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface DirectMessageListProps {
    onUserSelect: (user: DBUser) => void
    selectedUser?: DBUser | null
}

const UserStatus = ({ status }: { status: string }) => {
    return (
        <div
            className={cn(
                "w-2 h-2 rounded-full absolute bottom-0 right-0",
                status === 'online' ? 'bg-green-500' : 'bg-gray-500'
            )}
        />
    )
}

export const DirectMessageList = ({ onUserSelect, selectedUser }: DirectMessageListProps) => {
    const [users, setUsers] = useState<DBUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { getUsers, supabase } = useSupabase()

    // Fetch users with online status
    const fetchUsers = async () => {
        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser()
            if (!currentUser) return

            const { data, error } = await supabase
                .from('online_users')
                .select('*')
                .neq('id', currentUser.id) // Don't include current user
                .order('is_online', { ascending: false })
                .order('email', { ascending: true })

            if (error) throw error
            setUsers(data)
            setIsLoading(false)
        } catch (error) {
            console.error('Failed to fetch users:', error)
        }
    }

    // Initial fetch
    useEffect(() => {
        fetchUsers()

        // Poll for updates every 10 seconds
        const interval = setInterval(fetchUsers, 10000)

        return () => clearInterval(interval)
    }, [])

    // Sort users (online first, then by email)
    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {
            if (a.is_online && !b.is_online) return -1
            if (!a.is_online && b.is_online) return 1
            return a.email.localeCompare(b.email)
        })
    }, [users])

    return (
        <div className="space-y-[2px]">
            {sortedUsers.map((user) => (
                <button
                    key={user.id}
                    onClick={() => onUserSelect(user)}
                    className={cn(
                        "w-full flex items-center gap-2 px-4 py-1.5 hover:bg-accent rounded-md",
                        selectedUser?.id === user.id && "bg-accent"
                    )}
                >
                    <div className="relative">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback className="text-xs">
                                {user.email?.[0].toUpperCase() || ''}
                            </AvatarFallback>
                        </Avatar>
                        <UserStatus status={user.is_online ? 'online' : 'offline'} />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-xs font-medium truncate">
                            {user.email}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            {user.is_online ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </button>
            ))}
        </div>
    )
} 