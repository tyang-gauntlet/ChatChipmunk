"use client"

import { useEffect, useState } from "react"
import { Hash, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useRouter, usePathname } from "next/navigation"
import { useSupabase } from "@/lib/hooks/use-supabase-actions"

interface Channel {
    id: string
    name: string
    is_private: boolean
}

export function ChannelList() {
    const { getChannels } = useSupabase()
    const [channels, setChannels] = useState<Channel[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const fetchChannels = async () => {
            try {
                setIsLoading(true)
                const data = await getChannels()
                setChannels(data || [])
            } catch (error) {
                console.error('Failed to fetch channels:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchChannels()
    }, [getChannels])

    if (isLoading) {
        return <div className="p-4">Loading channels...</div>
    }

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