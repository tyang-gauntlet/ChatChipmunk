"use client"

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { SmileIcon, MessageSquareIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { format } from 'date-fns'
import { useSupabase } from '@/lib/hooks/use-supabase-actions'
import MessageAttachment from './message-attachment'

interface Reaction {
    id: string
    emoji: string
    users: { id: string; fullName: string }[]
}

interface MessageProps {
    id: string
    content: string
    attachments: any[]
    createdAt: string
    user: {
        id: string
        fullName: string
        avatarUrl?: string
    }
    reactions: Reaction[]
    replyCount: number
    onReply: (messageId: string) => void
}

export const Message = ({
    id,
    content,
    attachments,
    createdAt,
    user,
    reactions: initialReactions = [],
    replyCount,
    onReply,
}: MessageProps) => {
    const [showActions, setShowActions] = useState(false)
    const [currentReactions, setCurrentReactions] = useState<Reaction[]>(initialReactions)
    const { supabase, addReaction, removeReaction } = useSupabase()

    useEffect(() => {
        const channel = supabase
            .channel(`public:reactions:${id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'reactions',
                filter: `message_id=eq.${id}`
            }, (payload: any) => {
                if (payload.eventType === 'INSERT') {
                    setCurrentReactions(prev => [...prev, payload.new])
                } else if (payload.eventType === 'DELETE') {
                    setCurrentReactions(prev => prev.filter(r => r.id !== payload.old.id))
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [id, supabase])

    const handleReaction = async (emoji: string) => {
        try {
            const existingReaction = currentReactions?.find(r => r.emoji === emoji)
            if (existingReaction) {
                await removeReaction(existingReaction.id)
                setCurrentReactions(prev => prev.filter(r => r.id !== existingReaction.id))
            } else {
                const newReaction = await addReaction(id, emoji)
                if (newReaction) {
                    setCurrentReactions(prev => [...prev, newReaction])
                }
            }
        } catch (error) {
            console.error('Failed to handle reaction:', error)
        }
    }

    return (
        <div
            className="group flex gap-3 py-2 px-4 hover:bg-accent/50 relative"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="relative">
                <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback className="text-xs">
                        {(user.fullName || '?')[0]?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            </div>

            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <span className="font-semibold">{user.fullName}</span>
                    <span className="text-xs text-muted-foreground">
                        {format(new Date(createdAt), 'p')}
                    </span>
                </div>

                <div dangerouslySetInnerHTML={{ __html: content }} />

                {attachments?.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                        {attachments.map(attachment => (
                            <MessageAttachment
                                key={attachment.id}
                                attachment={attachment}
                            />
                        ))}
                    </div>
                )}

                {(currentReactions?.length > 0 || replyCount > 0) && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-2">
                        <div className="flex flex-wrap gap-1">
                            {currentReactions.map((reaction) => (
                                <div key={reaction.id} className="flex flex-col items-center">
                                    <button
                                        className="flex items-center gap-1 bg-accent rounded-full px-2 py-1 hover:bg-accent/80"
                                        onClick={() => handleReaction(reaction.emoji)}
                                    >
                                        <span>{reaction.emoji}</span>
                                    </button>
                                    <span className="text-[10px] text-muted-foreground mt-0.5">
                                        {reaction.users?.length || 0}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {replyCount > 0 && (
                            <div className="flex flex-col items-center">
                                <button
                                    className="flex items-center gap-1 hover:text-foreground"
                                    onClick={() => onReply(id)}
                                >
                                    <MessageSquareIcon className="h-3 w-3" />
                                    <span>{replyCount}</span>
                                </button>
                                <span className="text-[10px] text-muted-foreground mt-0.5">
                                    {replyCount === 1 ? 'reply' : 'replies'}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showActions && (
                <div className="absolute right-4 top-2 flex items-center gap-2 bg-background border rounded-md p-1">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <SmileIcon className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Picker
                                data={data}
                                onEmojiSelect={(emoji: any) => handleReaction(emoji.native)}
                            />
                        </PopoverContent>
                    </Popover>

                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onReply(id)}
                        >
                            <MessageSquareIcon className="h-4 w-4" />
                        </Button>
                        {replyCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                                {replyCount > 99 ? '99+' : replyCount}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}