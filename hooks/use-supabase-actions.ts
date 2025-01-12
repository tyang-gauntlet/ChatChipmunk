import { useCallback } from 'react'
import { getSupabaseClient } from '../lib/supabase/client'
import { User, Reaction, Channel, MessageWithUser } from '@/lib/types/chat.types';

export const useSupabase = () => {
    const supabase = getSupabaseClient();

    const getPublicUser = useCallback(async (): Promise<User | null> => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) return null;

            // Try to get existing user
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            // If user doesn't exist, create one
            if (error && error.code === 'PGRST116') {
                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert({
                        id: user.id,
                        username: user.user_metadata?.username || user.email?.split('@')[0],
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;
                return newUser;
            }

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    }, [supabase]);

    // Channels
    const getChannels = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('channels')
                .select(`
                    id,
                    name,
                    channel_members (user_id)
                `)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data as unknown as Channel[];
        } catch (error) {
            console.error('Error fetching channels:', error);
            return [];
        }
    }, [supabase]);

    const createChannel = useCallback(async (name: string, description: string) => {
        try {
            const user = await getPublicUser();

            // Create channel
            const { data: channel, error: insertError } = await supabase
                .from('channels')
                .insert({
                    name: name.toLowerCase().trim(),
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Add creator as channel member
            const { error: memberError } = await supabase
                .from('channel_members')
                .insert({
                    channel_id: channel.id,
                    user_id: user?.id,
                    joined_at: new Date().toISOString()
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
    const getChannelMessages = useCallback(async (channelId: string): Promise<MessageWithUser[]> => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    id,
                    content,
                    created_at,
                    channel_id,
                    parent_id,
                    attachments,
                    user_id,
                    user:users!inner (
                        id,
                        username,
                        status
                    )
                `)
                .eq('channel_id', channelId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching messages:', error);
                throw error;
            }

            return data as unknown as MessageWithUser[];
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
            const user = await getPublicUser();
            if (!user) throw new Error('User not found');

            const messageData = {
                channel_id: channelId,
                content,
                user_id: user.id,
                parent_id: parentId,
                attachments,
                created_at: new Date().toISOString()
            };

            console.log('Message data to insert:', messageData); // Debug log

            const { data, error } = await supabase
                .from('messages')
                .insert(messageData)
                .select()
                .single();

            if (error) {
                console.error('Database error:', error); // More detailed error logging
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }, [supabase, getPublicUser]);

    // Direct Messages
    const getDirectMessages = useCallback(async (userId: string) => {
        const user = await getPublicUser();

        const { data, error } = await supabase
            .from('direct_messages')
            .select(`
                *,
                sender:sender_id(id, full_name, avatar_url),
                receiver:receiver_id(id, full_name, avatar_url)
            `)
            .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    }, [supabase,]);

    const sendDirectMessage = useCallback(async (
        receiverId: string,
        content: string,
        attachments?: any[]
    ) => {
        const user = await getPublicUser();

        const { data, error } = await supabase
            .from('direct_messages')
            .insert({
                sender_id: user?.id,
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
    const addReaction = useCallback(async (messageId: string, emoji: string): Promise<Reaction> => {
        const user = await getPublicUser();

        const { data, error } = await supabase
            .from('reactions')
            .insert({
                message_id: messageId,
                emoji,
                user_id: user?.id
            })
            .select('*')
            .single()

        if (error) throw error

        return data as Reaction
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
        const user = await getPublicUser();

        const { error } = await supabase
            .from('channel_members')
            .insert({
                channel_id: channelId,
                user_id: user?.id,
            });
        if (error) throw error;
    }, [supabase]);

    const leaveChannel = useCallback(async (channelId: string) => {
        const user = await getPublicUser();

        const { error } = await supabase
            .from('channel_members')
            .delete()
            .match({ channel_id: channelId, user_id: user?.id });
        if (error) throw error;
    }, [supabase]);

    // Users
    const updateUserStatus = useCallback(async (status: 'online' | 'offline') => {
        try {
            const user = await getPublicUser();

            const { error } = await supabase
                .from('users')
                .update({
                    status,
                })
                .eq('id', user?.id)

            if (error) throw error
        } catch (error) {
            console.error('Error updating status:', error)
            throw error
        }
    }, [supabase]);

    const getUsers = useCallback(async (): Promise<User[]> => {
        try {
            const user = await getPublicUser();

            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .neq('id', user?.id) // Don't include current user

            if (error) {
                console.error('Error fetching users:', error)
                throw error
            }

            return users as User[]
        } catch (error) {
            console.error('Error fetching users:', error)
            throw error
        }
    }, [supabase])

    const uploadFile = async (file: File) => {
        const supabase = getSupabaseClient()

        // Create a unique file name
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `uploads/${fileName}`

        const { data, error } = await supabase.storage
            .from('attachments')
            .upload(filePath, file)

        if (error) throw error

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath)

        return {
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            url: publicUrl
        }
    }



    return {
        getPublicUser,
        // Channels
        getChannels,
        createChannel,
        deleteChannel,
        // Messages
        getChannelMessages,
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
        getUsers,
        uploadFile
    };
}; 