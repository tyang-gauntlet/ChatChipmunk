"use client"

import { DBUser } from "@/lib/types"
import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/hooks/use-supabase-actions"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { cn } from "@/lib/utils"

interface DirectMessageListProps {
    onUserSelect: (user: DBUser) => void
    selectedUser?: DBUser | null
}

export const DirectMessageList = ({ onUserSelect, selectedUser }: DirectMessageListProps) => {
    const [users, setUsers] = useState<DBUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { getUsers, supabase } = useSupabase()

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setIsLoading(true)
                const users = await getUsers()
                setUsers(users)
            } catch (error) {
                console.error('Failed to fetch users:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchUsers()
    }, [getUsers])

    // Subscribe to user presence changes
    useEffect(() => {
        const channel = supabase
            .channel('public:users')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'users'
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setUsers(prev => [...prev, payload.new as DBUser])
                } else if (payload.eventType === 'UPDATE') {
                    setUsers(prev => prev.map(user =>
                        user.id === payload.new.id ? { ...user, ...payload.new } : user
                    ))
                } else if (payload.eventType === 'DELETE') {
                    setUsers(prev => prev.filter(user => user.id !== payload.old.id))
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    if (isLoading) {
        return <div className="px-4 py-2 text-sm text-muted-foreground">Loading users...</div>
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
                    className={cn(
                        "w-full flex items-center gap-2 px-4 py-1.5 hover:bg-accent rounded-md",
                        selectedUser?.id === user.id && "bg-accent"
                    )}
                >
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>
                            {user.email?.[0].toUpperCase() || ''}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-sm">
                        <span className="truncate">{user.email}</span>
                        {user.status && (
                            <span className="text-xs text-muted-foreground">
                                {user.status}
                            </span>
                        )}
                    </div>
                </button>
            ))}
        </div>
    )
} 