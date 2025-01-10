"use client"

import { useEffect, useState } from "react"
import { Hash, Lock, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useRouter, usePathname } from "next/navigation"
import { useSupabase } from "@/lib/hooks/use-supabase-actions"
import { Channel } from "@/lib/types"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ChannelListProps {
    onChannelSelect: (channel: Channel) => void;
}

export function ChannelList({ onChannelSelect }: ChannelListProps) {
    const { getChannels, deleteChannel, supabase } = useSupabase()
    const [channels, setChannels] = useState<Channel[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const pathname = usePathname()
    const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null)

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

    useEffect(() => {
        const channel = supabase
            .channel('public:channels')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'channels'
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setChannels(prev => [...prev, payload.new as Channel])
                } else if (payload.eventType === 'DELETE') {
                    setChannels(prev => prev.filter(ch => ch.id !== payload.old.id))
                } else if (payload.eventType === 'UPDATE') {
                    setChannels(prev => prev.map(ch =>
                        ch.id === payload.new.id ? { ...ch, ...payload.new } : ch
                    ))
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    const handleDelete = async () => {
        if (!channelToDelete) return;
        try {
            await deleteChannel(channelToDelete.id);
            setChannelToDelete(null);
        } catch (error) {
            console.error('Failed to delete channel:', error);
            alert('Failed to delete channel. Check console for details.');
        }
    };

    if (isLoading) {
        return <div className="p-4">Loading channels...</div>
    }

    return (
        <>
            <ScrollArea className="space-y-1">
                {channels.map((channel) => (
                    <div key={channel.id} className="flex items-center group">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "w-full justify-start font-normal",
                                pathname === `/channels/${channel.id}` && "bg-accent"
                            )}
                            onClick={() => onChannelSelect(channel)}
                        >
                            {channel.is_private ? (
                                <Lock className="mr-2 h-4 w-4" />
                            ) : (
                                <Hash className="mr-2 h-4 w-4" />
                            )}
                            {channel.name}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setChannelToDelete(channel)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
            </ScrollArea>

            <AlertDialog open={!!channelToDelete} onOpenChange={() => setChannelToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Channel</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete #{channelToDelete?.name}? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
} 