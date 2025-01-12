"use client"

import { useEffect, useState } from 'react'
import { useSupabase } from '@/hooks/use-supabase-actions'
import { getSupabaseClient } from '@/lib/supabase/client'
import { User } from '@/lib/types/chat.types'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

interface DirectMessageListProps {
    onUserSelect: (user: User) => void;
}

export const DirectMessageList = ({ onUserSelect }: DirectMessageListProps) => {
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { getUsers } = useSupabase()
    const supabase = getSupabaseClient()
    const pathname = usePathname()

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setIsLoading(true)
                const data = await getUsers()
                setUsers(data)
            } catch (error) {
                console.error('Failed to fetch users:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchUsers()

        // Subscribe to user changes
        const userChannel = supabase
            .channel('public:users')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'users'
            }, async (payload) => {
                if (payload.eventType === 'INSERT') {
                    const { data: newUser } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', payload.new.id)
                        .single();

                    if (newUser) {
                        setUsers(prev => [...prev, newUser as User]);
                    }
                } else if (payload.eventType === 'UPDATE') {
                    setUsers(prev => prev.map(user =>
                        user.id === payload.new.id
                            ? { ...user, ...payload.new }
                            : user
                    ));
                } else if (payload.eventType === 'DELETE') {
                    setUsers(prev => prev.filter(user => user.id !== payload.old.id));
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(userChannel)
        }
    }, [getUsers])

    if (isLoading) {
        return <div className="px-4 py-2">Loading users...</div>
    }

    return (
        <div className="space-y-1">
            {users.map((user) => (
                <Button
                    key={user.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "w-full justify-start font-normal relative pl-8",
                        pathname === `/dm/${user.id}` && "bg-accent"
                    )}
                    onClick={() => onUserSelect(user)}
                >
                    <span
                        className={cn(
                            "absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full",
                            user.status === 'online' ? 'bg-green-500' : 'bg-muted'
                        )}
                    />
                    <span className="truncate">{user.username}</span>
                </Button>
            ))}
        </div>
    )
} 