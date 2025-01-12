"use client"

import { useEffect, useRef, useState } from 'react'
import Message from './message'
import type { MessageWithUser } from '@/lib/types/chat.types'
import { useSupabase } from '@/hooks/use-supabase-actions'
import { getSupabaseClient } from '@/lib/supabase/client'

interface MessageListProps {
    channelId?: string | null
    parentId?: string | null
    receiverId?: string | null
    highlightId?: string
}

export const MessageList = ({ channelId, parentId, receiverId, highlightId }: MessageListProps) => {
    const [messages, setMessages] = useState<MessageWithUser[]>([])
    const { getChannelMessages } = useSupabase()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const supabase = getSupabaseClient()

    // Scroll to bottom with smooth animation
    const scrollToBottom = (smooth = true) => {
        if (containerRef.current) {
            const { scrollHeight, clientHeight } = containerRef.current
            containerRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: smooth ? 'smooth' : 'auto'
            })
        }
    }

    // Check if scroll is near bottom
    const isNearBottom = () => {
        if (containerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = containerRef.current
            return scrollHeight - scrollTop - clientHeight < 100
        }
        return false
    }

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                if (!channelId) return
                const data = await getChannelMessages(channelId)
                // Sort messages by created_at
                const sortedMessages = [...data].sort((a, b) => {
                    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return dateA - dateB;
                });
                setMessages(sortedMessages)
                scrollToBottom(false)
            } catch (error) {
                console.error('Failed to fetch messages:', error)
            }
        }

        fetchMessages()

        // Subscribe to new messages
        const channel = supabase
            .channel(`messages:${channelId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `channel_id=eq.${channelId}`
            }, async (payload) => {
                const { data: messageWithUser } = await supabase
                    .from('messages')
                    .select(`
                        *,
                        user:users!inner (
                            id,
                            username,
                            status
                        )
                    `)
                    .eq('id', payload.new.id)
                    .single();

                if (messageWithUser) {
                    setMessages(prev => [...prev, messageWithUser as MessageWithUser])
                    if (isNearBottom()) {
                        scrollToBottom(true)
                    }
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [channelId, getChannelMessages])

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto p-4 flex flex-col justify-end"
        >
            {messages.map((message) => (
                <Message
                    key={message.id}
                    message={message}
                    onReply={() => { }}
                />
            ))}
            <div ref={messagesEndRef} className="h-1" />
        </div>
    )
}