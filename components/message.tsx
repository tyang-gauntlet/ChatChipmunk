"use client"

import { useState, useEffect } from 'react'
import { Avatar } from './ui/avatar'
import { Button } from './ui/button'
import { SmileIcon, MessageSquareIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { format } from 'date-fns'
import { useSupabase } from '@/hooks/use-supabase-actions'
import MessageAttachment from './message-attachment'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { MessageWithUser } from '@/lib/types/chat.types'

interface MessageProps {
    message: MessageWithUser;
    onReply: (messageId: string) => void;
}

type ReactionPayload = {
    emoji: string;
    id: string;
    message_id: string | null;
    user_id: string | null;
};

export default function Message({ message, onReply }: MessageProps) {
    if (!message) return null;

    const { id, content, created_at, attachments, user, threads } = message;
    const [showActions, setShowActions] = useState(false);
    const [currentReactions, setCurrentReactions] = useState<ReactionPayload[]>([]);
    const { addReaction, removeReaction } = useSupabase();

    const replyCount = threads?.length || 0;

    const fetchReactions = async () => {
        const supabase = getSupabaseClient();
        const { data } = await supabase
            .from('reactions')
            .select('*')
            .eq('message_id', id);
        if (data) {
            setCurrentReactions(data);
        }
    };

    useEffect(() => {
        const supabase = getSupabaseClient();
        fetchReactions();

        // Subscribe to ALL reaction changes
        const channel = supabase
            .channel(`reactions:${id}`)
            .on<ReactionPayload>(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'reactions',
                    filter: `message_id=eq.${id}`
                },
                (payload) => {
                    setCurrentReactions(prev => [...prev, payload.new]);
                }
            )
            .on<ReactionPayload>(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'reactions',
                    filter: `message_id=eq.${id}`
                },
                (payload) => {
                    setCurrentReactions(prev => prev.filter(r => r.id !== payload.old.id));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const handleReaction = async (emoji: string) => {
        try {
            const existingReaction = currentReactions.find(r =>
                r.emoji === emoji
            );

            if (existingReaction) {
                // Optimistically remove the reaction
                setCurrentReactions(prev =>
                    prev.filter(r => r.id !== existingReaction.id)
                );
                await removeReaction(existingReaction.id);
            } else {
                const newReaction = await addReaction(id, emoji);
                // Let the subscription handle the addition
            }
        } catch (error) {
            console.error('Failed to handle reaction:', error);
            // Revert optimistic update on error
            fetchReactions();
        }
    };

    const groupedReactions = currentReactions.reduce((acc, reaction) => {
        acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div
            className="group flex gap-3 py-2 px-4 hover:bg-accent/50 relative"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="relative">
                <Avatar className="h-6 w-6">
                    <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-xs">
                        {user?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                </Avatar>
            </div>

            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{user?.username}</span>
                    <span className="text-[10px] text-muted-foreground">
                        {created_at ? format(new Date(created_at), 'p') : ''}
                    </span>
                </div>

                <div className="text-sm" dangerouslySetInnerHTML={{ __html: content }} />

                {attachments && Array.isArray(attachments) && attachments.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                        {attachments.map((attachment) => (
                            <MessageAttachment
                                key={(attachment as any).url}
                                attachment={attachment as { url: string; file_name: string; file_type: string; }}
                            />
                        ))}
                    </div>
                )}

                {/* Reactions */}
                {currentReactions?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(groupedReactions).map(([emoji, count]) => (
                            <div
                                key={emoji}
                                className="flex flex-col items-center"
                            >
                                <button
                                    className="flex items-center gap-1 bg-accent rounded-full px-2 py-1 hover:bg-accent/80"
                                    onClick={() => handleReaction(emoji)}
                                >
                                    <span>{emoji}</span>
                                    <span className="text-xs">{count}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Reply Count */}
                {replyCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <button
                            className="flex items-center gap-1 hover:text-foreground"
                            onClick={() => {
                                console.log('Reply clicked:', id);
                                onReply(id);
                            }}
                        >
                            <MessageSquareIcon className="h-3 w-3" />
                            <span>{replyCount}</span>
                            <span className="text-muted-foreground">
                                {replyCount === 1 ? 'reply' : 'replies'}
                            </span>
                        </button>
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
                            onClick={() => {
                                console.log('Reply clicked:', id);
                                onReply(id);
                            }}
                        >
                            <MessageSquareIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
