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
    const { getChannelMessages, getDirectMessages, subscribeToDirectMessages } = useSupabase()
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
        const loadMessages = async () => {
            try {
                let fetchedMessages: MessageWithUser[] = [];
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
                        .order('created_at', { ascending: true });
                    fetchedMessages = data as MessageWithUser[];
                } else if (receiverId) {
                    fetchedMessages = await getDirectMessages(receiverId);
                } else if (channelId) {
                    const messages = await getChannelMessages(channelId);
                    // For channel view, only show messages without parent_id
                    fetchedMessages = messages.filter(m => !m.parent_id);
                }
                setMessages(fetchedMessages);
                // Use setTimeout to ensure DOM has updated
                setTimeout(() => scrollToBottom(false), 100);
            } catch (error) {
                console.error('Error loading messages:', error);
            }
        };

        loadMessages();

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
                        .single();

                    if (messageWithUser) {
                        setMessages(prev => [...prev, messageWithUser as MessageWithUser]);
                        scrollToBottom(true);
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        } else if (receiverId) {
            // DM subscription
            let cleanup: (() => void) | undefined;
            subscribeToDirectMessages(receiverId, (newMessage) => {
                setMessages(prev => [...prev, newMessage]);
            }).then(unsubscribe => {
                cleanup = unsubscribe;
            });

            return () => {
                cleanup?.();
            };
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
                        .single();

                    if (messageWithUser && !messageWithUser.parent_id) {  // Only add if not a thread reply
                        setMessages(prev => [...prev, messageWithUser as MessageWithUser]);
                        if (isNearBottom()) {
                            scrollToBottom(true);
                        }
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [channelId, receiverId, parentId]);

    // Add this useEffect to handle message changes
    useEffect(() => {
        if (messages.length > 0) {
            // Small delay to ensure attachments are loaded
            setTimeout(() => scrollToBottom(true), 100);
        }
    }, [messages]);

    return (
        <div
            ref={containerRef}
            className={`message-list flex-1 overflow-y-auto p-4 flex flex-col min-h-0 ${className || ''}`}
            style={{ maxHeight: 'calc(100vh - 200px)' }}
        >
            <div className="flex-1" />
            {messages.map((message) => (
                <Message
                    key={message.id}
                    message={message}
                    onReply={onReply || (() => { })}
                />
            ))}
            <div ref={messagesEndRef} />
        </div>
    )
}