import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import { useCallback } from 'react';

export const useSupabase = () => {
    const supabase = createClientComponentClient<Database>();

    // Channels
    const getChannels = useCallback(async () => {
        const { data, error } = await supabase
            .from('channels')
            .select('*, channel_members(user_id)')
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    }, [supabase]);

    const createChannel = useCallback(async (name: string, description: string, isPrivate: boolean) => {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('channels')
            .insert({
                name,
                description,
                is_private: isPrivate,
                created_by: user.user.id,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    }, [supabase]);

    const deleteChannel = useCallback(async (channelId: string) => {
        const { error } = await supabase
            .from('channels')
            .delete()
            .eq('id', channelId);
        if (error) throw error;
    }, [supabase]);

    // Messages
    const getMessages = useCallback(async (channelId: string) => {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                users (id, full_name, avatar_url),
                reactions (
                    *,
                    users (id, full_name)
                )
            `)
            .eq('channel_id', channelId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    }, [supabase]);

    const getThreadMessages = useCallback(async (parentId: string) => {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                users (id, full_name, avatar_url),
                reactions (*, users (id, full_name))
            `)
            .eq('parent_id', parentId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    }, [supabase]);

    const sendMessage = useCallback(async (
        channelId: string,
        content: string,
        parentId?: string,
        attachments?: any[]
    ) => {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('messages')
            .insert({
                channel_id: channelId,
                user_id: user.user.id,
                content,
                parent_id: parentId,
                attachments,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
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
    const addReaction = useCallback(async (messageId: string, emoji: string) => {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('reactions')
            .insert({
                message_id: messageId,
                user_id: user.user.id,
                emoji,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    }, [supabase]);

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
    const updateUserStatus = useCallback(async (status: string) => {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('users')
            .update({
                status,
                last_seen: new Date().toISOString(),
            })
            .eq('id', user.user.id);
        if (error) throw error;
    }, [supabase]);

    const searchUsers = useCallback(async (query: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, avatar_url, status')
            .ilike('full_name', `%${query}%`)
            .limit(10);
        if (error) throw error;
        return data;
    }, [supabase]);

    return {
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
    };
}; 