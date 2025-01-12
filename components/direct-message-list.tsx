"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSupabase } from '@/hooks/use-supabase-actions'
import { getSupabaseClient } from '@/lib/supabase/client'
import { User } from '@/lib/types/chat.types'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { usePathname, useSearchParams } from 'next/navigation'

interface DirectMessageListProps {
    onUserSelect: (user: User) => void;
}

const DirectMessageListContent = ({ onUserSelect }: DirectMessageListProps) => {
    const { getUsers } = useSupabase();
    const [users, setUsers] = useState<User[]>([]);
    const searchParams = useSearchParams();
    const activeDmId = searchParams.get('dm');
    const supabase = getSupabaseClient();

    useEffect(() => {
        // Initial users fetch
        getUsers().then(setUsers);

        // Subscribe to user status changes
        const channel = supabase
            .channel('public:users')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'users'
            }, async (payload) => {
                if (payload.eventType === 'UPDATE') {
                    setUsers(prev => prev.map(user =>
                        user.id === payload.new.id
                            ? { ...user, ...payload.new }
                            : user
                    ));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [getUsers, supabase]);

    // Scroll to active DM
    useEffect(() => {
        if (activeDmId) {
            const userElement = document.getElementById(`dm-${activeDmId}`);
            if (userElement) {
                userElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [activeDmId]);

    return (
        <div className="space-y-1">
            {users.map((user) => (
                <button
                    key={user.id}
                    id={`dm-${user.id}`}
                    onClick={() => onUserSelect(user)}
                    className={cn(
                        "w-full text-left px-4 py-2 hover:bg-accent rounded-md transition-colors relative pl-8",
                        activeDmId === user.id && "bg-accent"
                    )}
                >
                    <span
                        className={cn(
                            "absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full",
                            user.status === 'online' ? 'bg-green-500' : 'bg-muted'
                        )}
                    />
                    {user.username}
                </button>
            ))}
        </div>
    );
};

export const DirectMessageList = (props: DirectMessageListProps) => {
    return (
        <Suspense fallback={<div className="px-4 py-2">Loading users...</div>}>
            <DirectMessageListContent {...props} />
        </Suspense>
    )
} 