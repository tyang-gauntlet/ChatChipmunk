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

export const MessageList = ({ channelId, receiverId, parentId, onReply, className, highlightId }: MessageListProps) => {
    const [messages, setMessages] = useState<MessageWithUser[]>([])
    const { getChannelMessages, getDirectMessages, subscribeToDirectMessages } = useSupabase()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const supabase = getSupabaseClient()

    // Add a helper function to wait for all content to load
    const waitForContentLoad = async (element: HTMLElement) => {
        // First wait for a tick to ensure React rendering is complete
        await new Promise(resolve => setTimeout(resolve, 0));

        // Wait for images
        const images = Array.from(element.getElementsByTagName('img'));
        const imagePromises = images.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        });

        // Wait longer for emojis and reactions to render
        const waitForElements = (selector: string) => {
            return new Promise(resolve => {
                const check = () => {
                    const elements = element.querySelectorAll(selector);
                    if (elements.length > 0) {
                        // Wait an extra tick after finding elements
                        setTimeout(resolve, 50);
                    } else {
                        setTimeout(check, 50);
                    }
                };
                check();
            });
        };

        await Promise.all([
            ...imagePromises,
            waitForElements('[data-emoji]'),
            waitForElements('[data-reply-count]')
        ]);

        // Final delay to ensure all animations and transitions are complete
        await new Promise(resolve => setTimeout(resolve, 150));
    };

    // Update the scroll to bottom function
    const scrollToBottom = async (smooth = true) => {
        if (containerRef.current) {
            await waitForContentLoad(containerRef.current);
            const { scrollHeight, clientHeight } = containerRef.current;
            containerRef.current.scrollTo({
                top: scrollHeight - clientHeight + 150, // Increased padding
                behavior: smooth ? 'smooth' : 'auto'
            });
        }
    };

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
                    const messages = await getDirectMessages(receiverId);
                    // Filter out thread messages from DM view
                    fetchedMessages = messages.filter(m => !m.parent_id);
                } else if (channelId) {
                    const messages = await getChannelMessages(channelId);
                    fetchedMessages = messages.filter(m => !m.parent_id);
                }
                setMessages(fetchedMessages);
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
                // Only add the message if it's not a thread reply
                if (!newMessage.parent_id) {
                    setMessages(prev => [...prev, newMessage]);
                }
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

    // Update the highlighted message scroll
    useEffect(() => {
        if (highlightId && messages.length > 0) {
            const messageElement = document.getElementById(`message-${highlightId}`);
            if (messageElement) {
                (async () => {
                    await waitForContentLoad(messageElement.parentElement || messageElement);
                    messageElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                    messageElement.classList.add('bg-accent/50');
                    setTimeout(() => {
                        messageElement.classList.remove('bg-accent/50');
                    }, 2000);
                })();
            }
        } else {
            scrollToBottom(false);
        }
    }, [highlightId, messages]);

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
                    elementId={`message-${message.id}`}
                    highlight={message.id === highlightId}
                />
            ))}
            <div ref={messagesEndRef} />
        </div>
    )
}