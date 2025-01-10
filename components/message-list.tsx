"use client"

import { useEffect, useRef, useState } from 'react'
import { Message as MessageComponent } from './message'
import type { Message } from '@/lib/types'
import { useSupabase } from '@/lib/hooks/use-supabase-actions'
import { createClient } from '@/lib/hooks/use-supabase-client'

interface MessageListProps {
    channelId?: string | null
    parentId?: string | null
    receiverId?: string | null
    onReply: (messageId: string) => void
}

export const MessageList = ({ channelId, parentId = null, receiverId = null, onReply }: MessageListProps) => {
    const { getMessages, getThreadMessages, getDirectMessages, addReaction, removeReaction } = useSupabase()
    const supabase = createClient()
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
        const id = channelId || receiverId || parentId;
        let filter = '';
        if (channelId) {
            filter = `channel_id=eq.${id}`;
        } else if (receiverId) {
            filter = `user_id=eq.${id}`;
        } else if (parentId) {
            filter = `parent_id=eq.${id}`;
        }
        if (!id) return;

        console.log('Subscribing to messages for:', id);

        const channel = supabase
            .channel(`messages:${id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: filter
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setMessages(prev => [...prev, payload.new as Message]);
                    setTimeout(() => scrollToBottom(), 100);
                } else if (payload.eventType === 'DELETE') {
                    setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
                }
            })
            .subscribe((status) => {
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [channelId, receiverId, parentId, supabase]);

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