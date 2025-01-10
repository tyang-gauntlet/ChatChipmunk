"use client"

import { useEffect, useRef } from 'react'
import { Message } from './message'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'

interface MessageListProps {
    channelId?: string
    receiverId?: string
    parentId?: string
    onReply: (messageId: string) => void
}

export const MessageList = ({ channelId, receiverId, parentId, onReply }: MessageListProps) => {
    const supabase = useSupabaseClient()
    const bottomRef = useRef<HTMLDivElement>(null)

    const { data: messages, isLoading, fetchNextPage } = useInfiniteScroll(
        async ({ pageParam = 0 }) => {
            const query = supabase
                .from('messages')
                .select(`
          id,
          content,
          attachments,
          created_at,
          user:user_id(id, full_name, avatar_url),
          reactions(emoji, user:user_id(id, full_name)),
          threads:messages!parent_id(id)
        `)
                .order('created_at', { ascending: false })
                .range(pageParam, pageParam + 49)

            if (channelId) {
                query.eq('channel_id', channelId)
            } else if (receiverId) {
                query.eq('receiver_id', receiverId)
            }
            if (parentId) {
                query.eq('parent_id', parentId)
            } else {
                query.is('parent_id', null)
            }

            const { data, error } = await query

            if (error) throw error
            return data
        }
    )

    const handleReaction = async (messageId: string, emoji: string) => {
        const { data: existingReaction } = await supabase
            .from('reactions')
            .select()
            .eq('message_id', messageId)
            .eq('emoji', emoji)
            .single()

        if (existingReaction) {
            await supabase
                .from('reactions')
                .delete()
                .eq('id', existingReaction.id)
        } else {
            await supabase
                .from('reactions')
                .insert({
                    message_id: messageId,
                    emoji,
                })
        }
    }

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    if (isLoading) {
        return <div>Loading...</div>
    }

    return (
        <div className="flex flex-col-reverse">
            <div ref={bottomRef} />
            {messages?.pages.flat().map((message) => (
                <Message
                    key={message.id}
                    id={message.id}
                    content={message.content}
                    attachments={message.attachments}
                    createdAt={message.created_at}
                    user={message.user}
                    reactions={message.reactions}
                    replyCount={message.threads?.length || 0}
                    onReaction={handleReaction}
                    onReply={onReply}
                />
            ))}
        </div>
    )
}