"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Hash, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useRouter, usePathname } from "next/navigation"

type Channel = {
    id: string
    name: string
    is_private: boolean
}

export function ChannelList() {
    const [channels, setChannels] = useState<Channel[]>([])
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClientComponentClient()

    useEffect(() => {
        const fetchChannels = async () => {
            const { data: channels, error } = await supabase
                .from('channels')
                .select('*')
                .order('name')

            if (!error && channels) {
                setChannels(channels)
            }
        }

        fetchChannels()

        // Subscribe to channel changes
        const channel = supabase
            .channel('channel-changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'channels' },
                () => fetchChannels()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    return (
        <ScrollArea className="space-y-1">
            {channels.map((channel) => (
                <Button
                    key={channel.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "w-full justify-start font-normal",
                        pathname === `/channels/${channel.id}` && "bg-accent"
                    )}
                    onClick={() => router.push(`/channels/${channel.id}`)}
                >
                    {channel.is_private ? (
                        <Lock className="mr-2 h-4 w-4" />
                    ) : (
                        <Hash className="mr-2 h-4 w-4" />
                    )}
                    {channel.name}
                </Button>
            ))}
        </ScrollArea>
    )
} 