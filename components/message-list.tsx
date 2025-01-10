"use client"

import { useEffect, useRef, useState } from 'react'
import { Message as MessageComponent } from './message'
import type { Message } from '@/lib/types'
import { useSupabase } from '@/lib/hooks/use-supabase-actions'

interface MessageListProps {
    channelId?: string
    receiverId?: string
    parentId?: string
    onReply: (messageId: string) => void
}

export const MessageList = ({ channelId, receiverId, parentId, onReply }: MessageListProps) => {
    const { getMessages, getThreadMessages, getDirectMessages, addReaction, removeReaction } = useSupabase()
    const bottomRef = useRef<HTMLDivElement>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                setIsLoading(true)
                let data: Message[] = []

                if (channelId) {
                    data = await getMessages(channelId)
                } else if (parentId) {
                    data = await getThreadMessages(parentId)
                } else if (receiverId) {
                    data = await getDirectMessages(receiverId)
                }

                setMessages(data)
            } catch (error) {
                console.error('Failed to fetch messages:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchMessages()
    }, [channelId, receiverId, parentId])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    if (isLoading) {
        return <div>Loading...</div>
    }

    return (
        <div className="flex flex-col-reverse">
            <div ref={bottomRef} />
            {messages.map((message) => (
                <MessageComponent
                    key={message.id}
                    id={message.id}
                    content={message.content}
                    attachments={message.attachments || []}
                    createdAt={message.created_at}
                    user={{
                        id: message.user.id,
                        fullName: message.user.full_name,
                        avatarUrl: message.user.avatar_url || undefined
                    }}
                    reactions={message.reactions.map(r => ({
                        emoji: r.emoji,
                        users: r.users.map(u => ({
                            id: u.id,
                            fullName: u.full_name
                        }))
                    }))}
                    replyCount={message.threads?.length || 0}
                    onReply={onReply}
                />
            ))}
        </div>
    )
}