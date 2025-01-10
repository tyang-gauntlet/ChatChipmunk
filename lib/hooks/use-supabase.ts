import { useCallback } from 'react'
import { getSupabaseClient } from '../supabase/client'
import type { Message, Channel, DBUser } from '../types'

export const useSupabase = () => {
    const supabase = getSupabaseClient()

    // Channels
    const getChannels = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('channels')
                .select(`
                    id,
                    name,
                    description,
                    is_private,
                    created_by,
                    created_at,
                    channel_members (
                        user_id
                    )
                `)
                .order('created_at', { ascending: true })

            if (error) {
                console.error('Error fetching channels:', error)
                throw error
            }

            console.log('Fetched channels:', data)
            return data as Channel[]
        } catch (error) {
            console.error('Error fetching channels:', error)
            return []
        }
    }, [supabase])

    // Messages
    const getMessages = useCallback(async (channelId: string) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    id,
                    content,
                    channel_id,
                    user_id,
                    parent_id,
                    attachments,
                    created_at,
                    user:users!messages_user_id_fkey (
                        id,
                        email,
                        full_name,
                        avatar_url
                    ),
                    reactions!reactions_message_id_fkey (
                        id,
                        emoji,
                        users:users!reactions_user_id_fkey (
                            id,
                            full_name
                        )
                    )
                `)
                .eq('channel_id', channelId)
                .order('created_at', { ascending: true })

            if (error) throw error

            return data.map(msg => ({
                id: msg.id,
                content: msg.content,
                attachments: msg.attachments,
                created_at: msg.created_at,
                user: {
                    id: msg.user[0]?.id,
                    full_name: msg.user[0]?.full_name,
                    avatar_url: msg.user[0]?.avatar_url
                },
                reactions: msg.reactions.map(r => ({
                    id: r.id,
                    emoji: r.emoji,
                    users: r.users.map(u => ({
                        id: u.id,
                        full_name: u.full_name
                    }))
                }))
            })) as Message[]
        } catch (error) {
            console.error('Error fetching messages:', error)
            throw error
        }
    }, [supabase])

    const getThreadMessages = useCallback(async (parentId: string) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    id,
                    content,
                    attachments,
                    created_at,
                    user:users(id, full_name, avatar_url),
                    reactions(
                        id, emoji,
                        users:user_id(id, full_name)
                    )
                `)
                .eq('parent_id', parentId)
                .order('created_at', { ascending: true })

            if (error) throw error

            return data.map(msg => ({
                id: msg.id,
                content: msg.content,
                attachments: msg.attachments || [],
                created_at: msg.created_at,
                user: {
                    id: msg.user[0]?.id,
                    full_name: msg.user[0]?.full_name,
                    avatar_url: msg.user[0]?.avatar_url
                },
                reactions: msg.reactions.map(r => ({
                    id: r.id,
                    emoji: r.emoji,
                    users: r.users.map(u => ({
                        id: u.id,
                        full_name: u.full_name
                    }))
                }))
            })) as Message[]
        } catch (error) {
            console.error('Error fetching thread messages:', error)
            throw error
        }
    }, [supabase])

    const sendMessage = useCallback(async (
        content: string,
        channelId?: string,
        parentId?: string,
        attachments?: any[]
    ) => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('messages')
                .insert({
                    content,
                    channel_id: channelId,
                    user_id: user.id,
                    parent_id: parentId,
                    attachments
                })
                .select(`
                    id,
                    content,
                    channel_id,
                    user_id,
                    parent_id,
                    attachments,
                    created_at,
                    user:users!messages_user_id_fkey (
                        id,
                        email,
                        avatar_url
                    )
                `)
                .single()

            if (error) {
                console.error('Error sending message:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Error sending message:', error)
            throw error
        }
    }, [supabase])

    // Users
    const getUsers = useCallback(async (): Promise<DBUser[]> => {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('email')

        if (error) {
            console.error('Error fetching users:', error)
            throw error
        }

        return users as DBUser[]
    }, [])

    // Reactions
    const addReaction = useCallback(async (messageId: string, emoji: string) => {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) throw new Error('Not authenticated')

        const { data, error } = await supabase
            .from('reactions')
            .insert({
                message_id: messageId,
                user_id: user.id,
                emoji,
            })
            .select()
            .single()

        if (error) throw error
        return data
    }, [])

    const removeReaction = useCallback(async (reactionId: string) => {
        const { error } = await supabase
            .from('reactions')
            .delete()
            .eq('id', reactionId)

        if (error) throw error
    }, [])

    const getCurrentUser = useCallback(async () => {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error || !session?.user) {
            throw new Error('Not authenticated')
        }
        return session.user
    }, [supabase])

    const createChannel = useCallback(async (name: string, description: string) => {
        try {
            const user = await getCurrentUser()

            // Create channel
            const { data: channel, error: insertError } = await supabase
                .from('channels')
                .insert({
                    name: name.toLowerCase().trim(),
                    description,
                    created_by: user.id,
                    is_private: false
                })
                .select()
                .single()

            if (insertError) throw insertError

            // Add creator as channel member
            const { error: memberError } = await supabase
                .from('channel_members')
                .insert({
                    channel_id: channel.id,
                    user_id: user.id
                })

            if (memberError) throw memberError

            return channel
        } catch (error) {
            console.error('Channel creation error:', error)
            throw error
        }
    }, [getCurrentUser])

    const getDirectMessages = useCallback(async (userId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('direct_messages')
                .select(`
                    id,
                    content,
                    sender_id,
                    receiver_id,
                    attachments,
                    created_at,
                    sender:users!direct_messages_sender_id_fkey!inner(
                        id,
                        full_name,
                        avatar_url
                    ),
                    receiver:users!direct_messages_receiver_id_fkey!inner(
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: true })

            if (error) throw error

            return (data.map(msg => ({
                id: msg.id,
                content: msg.content,
                sender_id: msg.sender_id,
                receiver_id: msg.receiver_id,
                attachments: msg.attachments || [],
                created_at: msg.created_at,
                sender: (msg.sender as unknown as { id: string; full_name: string; avatar_url: string }[])[0],
                receiver: (msg.receiver as unknown as { id: string; full_name: string; avatar_url: string }[])[0]
            })) as unknown) as {
                id: string
                content: string
                sender_id: string
                receiver_id: string
                attachments: any[]
                created_at: string
                sender: {
                    id: string
                    full_name: string
                    avatar_url: string
                }
                receiver: {
                    id: string
                    full_name: string
                    avatar_url: string
                }
            }[]
        } catch (error) {
            console.error('Error fetching direct messages:', error)
            throw error
        }
    }, [supabase])

    const sendDirectMessage = useCallback(async (
        receiverId: string,
        content: string,
        attachments?: any[]
    ) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('direct_messages')
                .insert({
                    content,
                    sender_id: user.id,
                    receiver_id: receiverId,
                    attachments
                })
                .select(`
                    id,
                    content,
                    sender_id,
                    receiver_id,
                    attachments,
                    created_at,
                    sender:users!direct_messages_sender_id_fkey!inner(
                        id,
                        full_name,
                        avatar_url
                    ),
                    receiver:users!direct_messages_receiver_id_fkey!inner(
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .single()
            if (error) throw error
            return ({
                ...data,
                sender: (data.sender as unknown as { id: string; full_name: string; avatar_url: string }[])[0],
                receiver: (data.receiver as unknown as { id: string; full_name: string; avatar_url: string }[])[0]
            }) as {
                id: string
                content: string
                sender_id: string
                receiver_id: string
                attachments: any[]
                created_at: string
                sender: {
                    id: string
                    full_name: string
                    avatar_url: string
                }
                receiver: {
                    id: string
                    full_name: string
                    avatar_url: string
                }
            }
        } catch (error) {
            console.error('Error sending direct message:', error)
            throw error
        }
    }, [supabase])

    return {
        getChannels,
        getMessages,
        getThreadMessages,
        sendMessage,
        getUsers,
        addReaction,
        removeReaction,
        createChannel,
        getDirectMessages,
        sendDirectMessage,
    }
} 