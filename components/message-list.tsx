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
    onReply?: (id: string) => void
    className?: string
}

export const MessageList = ({ channelId, receiverId, parentId, onReply, className }: MessageListProps) => {
    const [messages, setMessages] = useState<MessageWithUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { getChannelMessages, getDirectMessages, subscribeToDirectMessages } = useSupabase()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const supabase = getSupabaseClient()

    // Enhanced scroll to bottom with loading check
    const scrollToBottom = (smooth = true) => {
        // Longer delay to ensure content is fully rendered
        setTimeout(() => {
            if (containerRef.current) {
                const { scrollHeight, clientHeight } = containerRef.current;
                containerRef.current.style.scrollBehavior = smooth ? 'smooth' : 'auto';
                containerRef.current.scrollTo({
                    top: scrollHeight - clientHeight,
                    behavior: smooth ? 'smooth' : 'auto'
                });
            }
        }, 300); // Increased delay for smoother transition
    }

    // Check if scroll is near bottom
    const isNearBottom = () => {
        if (containerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = containerRef.current
            return scrollHeight - scrollTop - clientHeight < 100
        }
        return false
    }

    // Load messages effect
    useEffect(() => {
        setIsLoading(true)
        const loadMessages = async () => {
            try {
                let fetchedMessages: MessageWithUser[] = []
                if (parentId) {
                    // For threads, get messages with this parent_id
                    const { data } = await supabase
                        .from('messages')
                        .select(`
                            *,
                            user:users!inner (
                                id,
                                username,
                                status
                            )
                        `)
                        .eq('parent_id', parentId)
                        .order('created_at', { ascending: true })
                    fetchedMessages = data as MessageWithUser[]
                } else if (receiverId) {
                    const messages = await getDirectMessages(receiverId)
                    // Filter out thread messages from DM view
                    fetchedMessages = messages.filter(m => !m.parent_id)
                } else if (channelId) {
                    const messages = await getChannelMessages(channelId)
                    fetchedMessages = messages.filter(m => !m.parent_id)
                }
                setMessages(fetchedMessages)
                setIsLoading(false)
                scrollToBottom(false)
            } catch (error) {
                console.error('Error loading messages:', error)
                setIsLoading(false)
            }
        }

        loadMessages()

        // Set up subscriptions
        if (parentId) {
            // Thread subscription
            const channel = supabase
                .channel(`thread:${parentId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `parent_id=eq.${parentId}`
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
                        .single()

                    if (messageWithUser) {
                        setMessages(prev => [...prev, messageWithUser as MessageWithUser])
                        scrollToBottom(true)
                    }
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        } else if (receiverId) {
            // DM subscription
            let cleanup: (() => void) | undefined
            subscribeToDirectMessages(receiverId, (newMessage) => {
                // Only add the message if it's not a thread reply
                if (!newMessage.parent_id) {
                    setMessages(prev => [...prev, newMessage])
                }
            }).then(unsubscribe => {
                cleanup = unsubscribe
            })

            return () => {
                cleanup?.()
            }
        } else if (channelId) {
            // Channel subscription
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
                        .single()

                    if (messageWithUser && !messageWithUser.parent_id) {  // Only add if not a thread reply
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
        }
    }, [channelId, receiverId, parentId])

    // Scroll on new messages
    useEffect(() => {
        if (!isLoading && messages.length > 0) {
            scrollToBottom(true)
        }
    }, [messages, isLoading])

    return (
        <div
            ref={containerRef}
            className={`message-list flex-1 overflow-y-auto p-4 flex flex-col min-h-0 transition-all duration-300 ${className || ''}`}
            style={{ maxHeight: 'calc(100vh - 200px)' }}
        >
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-pulse">Loading messages...</div>
                </div>
            ) : (
                <>
                    <div className="flex-1" />
                    {messages.map((message) => (
                        <Message
                            key={message.id}
                            message={message}
                            onReply={onReply || (() => { })}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </>
            )}
        </div>
    )
}