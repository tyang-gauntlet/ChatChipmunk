"use client"

import { useEffect, useRef, useState } from 'react'
import { Message as MessageComponent } from './message'
import type { Message } from '@/lib/types'
import { useSupabase } from '@/lib/hooks/use-supabase-actions'

interface MessageListProps {
    channelId?: string | null
    parentId?: string | null
    receiverId?: string | null
    onReply: (messageId: string) => void
    highlightId?: string
}

export const MessageList = ({ channelId, parentId = null, receiverId = null, onReply, highlightId }: MessageListProps) => {
    const { getMessages, getThreadMessages, getDirectMessages, supabase } = useSupabase()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

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
                scrollToBottom()
            } catch (error) {
                console.error('Failed to fetch messages:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchMessages()
    }, [channelId, receiverId, parentId])

    useEffect(() => {
        const id = channelId || parentId;
        if (!id) return;

        const channel = supabase
            .channel(`public:messages:${id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: channelId
                    ? `channel_id=eq.${id}`
                    : `parent_id=eq.${id}`
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setMessages(prev => [...prev, payload.new as Message]);
                    setTimeout(scrollToBottom, 100);
                } else if (payload.eventType === 'DELETE') {
                    setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
                } else if (payload.eventType === 'UPDATE') {
                    setMessages(prev => prev.map(msg =>
                        msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
                    ));
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [channelId, parentId, supabase])

    useEffect(() => {
        if (highlightId) {
            const element = document.getElementById(`message-${highlightId}`)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
                element.classList.add('bg-accent')
                setTimeout(() => element.classList.remove('bg-accent'), 2000)
            }
        }
    }, [highlightId])

    if (isLoading) {
        return <div>Loading...</div>
    }

    return (
        <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="flex-1" />
            {messages.map((message) => (
                <MessageComponent
                    key={message.id}
                    id={message.id}
                    content={message.content}
                    attachments={message.attachments || []}
                    createdAt={message.created_at}
                    user={{
                        id: message.user?.id || '',
                        fullName: message.user?.full_name || '',
                        avatarUrl: message.user?.avatar_url || undefined
                    }}
                    reactions={message.reactions?.map(r => ({
                        id: r.id,
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
            <div ref={messagesEndRef} />
        </div>
    )
}