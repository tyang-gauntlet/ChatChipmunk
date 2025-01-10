"use client"

import { useEffect, useRef, useState } from 'react'
import { Message } from './message'
import type { DirectMessage } from '@/lib/types/direct-message'
import { useSupabase } from '@/lib/hooks/use-supabase'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface DirectMessageListProps {
    userId?: string;
    onReply?: (messageId: string) => void;
    onUserSelect?: (user: User) => void;
}

export const DirectMessageList = ({ userId, onReply }: DirectMessageListProps) => {
    const { getDirectMessages } = useSupabase()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [messages, setMessages] = useState<DirectMessage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = getSupabaseClient()

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                setIsLoading(true)
                if (!userId) return
                const data = await getDirectMessages(userId)
                setMessages(data)
                scrollToBottom()
            } catch (error) {
                console.error('Failed to fetch messages:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchMessages()
    }, [userId])

    useEffect(() => {
        const channel = supabase
            .channel(`direct_messages:${userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'direct_messages',
                filter: `sender_id=eq.${userId}`
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setMessages(prev => [...prev, payload.new as DirectMessage])
                    setTimeout(scrollToBottom, 100)
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, supabase])

    if (isLoading) {
        return <div>Loading...</div>
    }

    return (
        <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="flex-1" />
            {messages.map((message) => (
                <Message
                    key={message.id}
                    id={message.id}
                    content={message.content}
                    attachments={message.attachments}
                    createdAt={message.created_at}
                    user={{
                        id: message.sender.id,
                        fullName: message.sender.full_name,
                        avatarUrl: message.sender.avatar_url || undefined
                    }}
                    onReply={onReply || (() => { })}
                    reactions={[]}
                    replyCount={0}
                    isDirect={true}
                />
            ))}
            <div ref={messagesEndRef} />
        </div>
    )
} 