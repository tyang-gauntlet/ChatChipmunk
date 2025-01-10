"use client"

import { useState } from 'react'
import { Avatar } from './ui/avatar'
import { Button } from './ui/button'
import { SmileIcon, MessageSquareIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { format } from 'date-fns'

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
    reactions: {
        emoji: string
        users: { id: string; fullName: string }[]
    }[]
    replyCount: number
    onReply: (messageId: string) => void
}

export const Message = ({
    id,
    content,
    attachments,
    createdAt,
    user,
    reactions,
    replyCount,
    onReply,
}: MessageProps) => {
    const [showActions, setShowActions] = useState(false)
    // const { addReaction, removeReaction } = useSupabase()

    // const handleReaction = async (emoji: string) => {
    //     try {
    //         const existingReaction = reactions.find(r => r.emoji === emoji)
    //         if (existingReaction) {
    //             await removeReaction(existingReaction.id)
    //         } else {
    //             await addReaction(id, emoji)
    //         }
    //     } catch (error) {
    //         console.error('Failed to handle reaction:', error)
    //     }
    // }

    return (
        <div
            className="group flex gap-3 py-2 px-4 hover:bg-accent/50 relative"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <Avatar className="h-8 w-8">
                {!user.avatarUrl && (
                    <div className="bg-primary text-primary-foreground rounded-full h-full w-full flex items-center justify-center">
                        {user.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                )}
            </Avatar>

            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <span className="font-semibold">{user.fullName}</span>
                    <span className="text-xs text-muted-foreground">
                        {format(new Date(createdAt), 'p')}
                    </span>
                </div>

                <div dangerouslySetInnerHTML={{ __html: content }} />

                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {attachments.map((url, i) => (
                            <img
                                key={i}
                                src={url}
                                alt="attachment"
                                className="rounded-md max-w-sm"
                            />
                        ))}
                    </div>
                )}

                {(reactions.length > 0 || replyCount > 0) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        {/* {reactions.map((reaction, i) => (
                            <button
                                key={i}
                                className="flex items-center gap-1 bg-accent rounded-full px-2 py-1"
                                onClick={() => handleReaction(reaction.emoji)}
                            >
                                {reaction.emoji} {reaction.users.length}
                            </button>
                        ))} */}
                        {replyCount > 0 && (
                            <button
                                className="flex items-center gap-1"
                                onClick={() => onReply(id)}
                            >
                                <MessageSquareIcon className="h-3 w-3" />
                                {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                            </button>
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
                            {/* <Picker
                                data={data}
                                onEmojiSelect={(emoji: any) => handleReaction(emoji.native)}
                            /> */}
                        </PopoverContent>
                    </Popover>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onReply(id)}
                    >
                        <MessageSquareIcon className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    )
}