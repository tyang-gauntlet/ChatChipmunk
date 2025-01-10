import { useCallback } from 'react'
import { getSupabaseClient } from '../supabase/client'
import { DBUser, Reaction } from '@/lib/types';

export const useSupabase = () => {
    const supabase = getSupabaseClient();

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
                    channel_members (user_id)
                `)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching channels:', error);
            return [];
        }
    }, [supabase]);

    const createChannel = useCallback(async (name: string, description: string) => {
        try {
            const { data: user } = await supabase.auth.getUser();
            if (!user.user) throw new Error('Not authenticated');

            // Create channel
            const { data: channel, error: insertError } = await supabase
                .from('channels')
                .insert({
                    name: name.toLowerCase().trim(),
                    description,
                    created_by: user.user.id,
                    is_private: false
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Add creator as channel member
            const { error: memberError } = await supabase
                .from('channel_members')
                .insert({
                    channel_id: channel.id,
                    user_id: user.user.id
                });

            if (memberError) throw memberError;

            return channel;
        } catch (error) {
            console.error('Channel creation error:', error);
            throw error;
        }
    }, [supabase]);

    const deleteChannel = useCallback(async (channelId: string) => {
        try {
            // First delete channel members
            const { error: memberError } = await supabase
                .from('channel_members')
                .delete()
                .eq('channel_id', channelId);

            if (memberError) throw memberError;

            // Then delete messages
            const { error: messageError } = await supabase
                .from('messages')
                .delete()
                .eq('channel_id', channelId);

            if (messageError) throw messageError;

            // Finally delete the channel
            const { error: channelError } = await supabase
                .from('channels')
                .delete()
                .eq('id', channelId);

            if (channelError) throw channelError;

            return true;
        } catch (error) {
            console.error('Error deleting channel:', error);
            throw error;
        }
    }, [supabase]);

    // Messages
    const getMessages = useCallback(async (channelId: string) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`*`)
                .eq('channel_id', channelId)
                .order('created_at', { ascending: true })

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    }, [supabase]);

    const getThreadMessages = useCallback(async (parentId: string) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`*`)
                .eq('parent_id', parentId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    }, [supabase]);

    const sendMessage = useCallback(async (
        content: string,
        channelId?: string,
        parentId?: string,
        attachments?: any[]
    ) => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('messages')
                .insert({
                    channel_id: channelId,
                    content,
                    user_id: user.id,
                    parent_id: parentId,
                    attachments,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }, [supabase]);

    // Direct Messages
    const getDirectMessages = useCallback(async (userId: string) => {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('direct_messages')
            .select(`
                *,
                sender:sender_id(id, full_name, avatar_url),
                receiver:receiver_id(id, full_name, avatar_url)
            `)
            .or(`sender_id.eq.${user.user.id},receiver_id.eq.${user.user.id}`)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    }, [supabase]);

    const sendDirectMessage = useCallback(async (
        receiverId: string,
        content: string,
        attachments?: any[]
    ) => {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('direct_messages')
            .insert({
                sender_id: user.user.id,
                receiver_id: receiverId,
                content,
                attachments,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    }, [supabase]);

    // Reactions
    const addReaction = async (messageId: string, emoji: string): Promise<Reaction> => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No user')

        const { data, error } = await supabase
            .from('reactions')
            .insert({
                message_id: messageId,
                emoji,
                user_id: user.id
            })
            .select('id, emoji')
            .single()

        if (error) throw error

        // Ensure we return a properly typed reaction
        return {
            id: data.id,
            emoji: data.emoji,
            users: [{
                id: user.id,
                fullName: user.user_metadata.full_name || user.email // Fallback to email if name not available
            }]
        }
    }

    const removeReaction = useCallback(async (reactionId: string) => {
        const { error } = await supabase
            .from('reactions')
            .delete()
            .eq('id', reactionId);
        if (error) throw error;
    }, [supabase]);

    // Channel Members
    const joinChannel = useCallback(async (channelId: string) => {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('channel_members')
            .insert({
                channel_id: channelId,
                user_id: user.user.id,
            });
        if (error) throw error;
    }, [supabase]);

    const leaveChannel = useCallback(async (channelId: string) => {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('channel_members')
            .delete()
            .match({ channel_id: channelId, user_id: user.user.id });
        if (error) throw error;
    }, [supabase]);

    // Users
    const updateUserStatus = useCallback(async (status: 'online' | 'offline') => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) throw new Error('Not authenticated')

            const { error } = await supabase
                .from('users')
                .update({
                    status,
                    last_ping: status === 'online' ? new Date().toISOString() : null
                })
                .eq('id', user.id)

            if (error) throw error
        } catch (error) {
            console.error('Error updating status:', error)
            throw error
        }
    }, [supabase])

    const searchUsers = useCallback(async (query: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, avatar_url, status')
            .ilike('full_name', `%${query}%`)
            .limit(10);
        if (error) throw error;
        return data;
    }, [supabase]);

    const getUsers = useCallback(async (): Promise<DBUser[]> => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .neq('id', user.id) // Don't include current user
                .order('email')

            if (error) {
                console.error('Error fetching users:', error)
                throw error
            }

            return users as DBUser[]
        } catch (error) {
            console.error('Error fetching users:', error)
            throw error
        }
    }, [supabase])

    interface SearchResult {
        type: 'message' | 'channel' | 'user'
        id: string
        content?: string
        channelId?: string
        parentId?: string
        userId?: string
        title: string
        subtitle: string
        timestamp?: string
    }

    const searchAll = useCallback(async (query: string): Promise<SearchResult[]> => {
        if (!query.trim()) return []

        try {
            const [messagesRes, channelsRes, usersRes] = await Promise.all([
                // Search messages using the custom function
                supabase
                    .rpc('search_messages', { search_query: query })
                    .select(`
                        id,
                        content,
                        channel_id,
                        parent_id,
                        created_at,
                        user:user_id (id, email)
                    `),

                // Search channels
                supabase
                    .from('channels')
                    .select('id, name, description')
                    .textSearch('name', query, { type: 'plain' })
                    .limit(5),

                // Search users
                supabase
                    .from('users')
                    .select('id, email, full_name')
                    .textSearch('email', query, { type: 'plain' })
                    .limit(5)
            ])

            const results: SearchResult[] = []

            // Format message results
            if (!messagesRes.error && messagesRes.data) {
                results.push(...messagesRes.data.map(msg => ({
                    type: 'message' as const,
                    id: msg.id,
                    content: msg.content,
                    channelId: msg.channel_id,
                    parentId: msg.parent_id,
                    userId: msg.user?.[0]?.id || '',
                    title: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
                    subtitle: `by ${msg.user?.[0]?.email || 'Unknown'}`,
                    timestamp: msg.created_at
                })))
            }

            // Format channel results
            if (!channelsRes.error && channelsRes.data) {
                results.push(...channelsRes.data.map(channel => ({
                    type: 'channel' as const,
                    id: channel.id,
                    title: `#${channel.name}`,
                    subtitle: channel.description || 'No description'
                })))
            }

            // Format user results
            if (!usersRes.error && usersRes.data) {
                results.push(...usersRes.data.map(user => ({
                    type: 'user' as const,
                    id: user.id,
                    title: user.full_name || user.email,
                    subtitle: user.full_name ? user.email : 'Direct Message'
                })))
            }

            return results
        } catch (error) {
            console.error('Search error:', error)
            return []
        }
    }, [supabase])

    return {
        supabase,
        // Channels
        getChannels,
        createChannel,
        deleteChannel,
        // Messages
        getMessages,
        getThreadMessages,
        sendMessage,
        // Direct Messages
        getDirectMessages,
        sendDirectMessage,
        // Reactions
        addReaction,
        removeReaction,
        // Channel Members
        joinChannel,
        leaveChannel,
        // Users
        updateUserStatus,
        searchUsers,
        getUsers,
        searchAll,
    };
}; 