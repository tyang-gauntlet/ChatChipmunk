"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useRouter, usePathname } from "next/navigation"

type User = {
    id: string
    full_name: string
    avatar_url?: string
    status?: string
}

export function DirectMessageList() {
    const [users, setUsers] = useState<User[]>([])
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClientComponentClient()

    useEffect(() => {
        const fetchUsers = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .neq('id', user.id)
                .order('full_name')

            if (!error && users) {
                setUsers(users)
            }
        }

        fetchUsers()

        // Subscribe to user status changes
        const channel = supabase
            .channel('user-presence')
            .on('presence', { event: 'sync' }, () => fetchUsers())
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
    }

    return (
        <ScrollArea className="space-y-1">
            {users.map((user) => (
                <Button
                    key={user.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "w-full justify-start font-normal",
                        pathname === `/dm/${user.id}` && "bg-accent"
                    )}
                    onClick={() => router.push(`/dm/${user.id}`)}
                >
                    <Avatar className="h-6 w-6 mr-2">
                        {user.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar_url} alt={user.full_name} />
                        ) : (
                            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                        )}
                    </Avatar>
                    <span className="truncate">{user.full_name}</span>
                    {user.status && (
                        <span className="ml-auto text-xs text-muted-foreground">
                            {user.status}
                        </span>
                    )}
                </Button>
            ))}
        </ScrollArea>
    )
} 