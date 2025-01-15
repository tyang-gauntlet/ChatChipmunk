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
    const getDirectMessages = useCallback(async (receiverId: string): Promise<MessageWithUser[]> => {
        try {
            const user = await getPublicUser();
            if (!user) throw new Error('No user found');

            const { data, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    user:users!inner (
                        id,
                        username,
                        status
                    ),
                    direct_messages!inner (
                        sender_id,
                        receiver_id
                    ),
                    threads:messages!parent_id(*)
                `)
                .filter('direct_messages.sender_id', 'in', `(${user.id},${receiverId})`)
                .filter('direct_messages.receiver_id', 'in', `(${user.id},${receiverId})`)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data as unknown as MessageWithUser[];
        } catch (error) {
            console.error('Error fetching direct messages:', error);
            throw error;
        }
    }, [supabase]);

    const sendDirectMessage = useCallback(async (
        receiverId: string,
        content: string,
        attachments?: any[],
        parentId?: string
    ) => {
        console.log('sendDirectMessage called with:', { receiverId, content, parentId }); // Debug log
        try {
            const user = await getPublicUser();
            if (!user) throw new Error('No user found');

            const messageData = {
                content,
                user_id: user.id,
                attachments,
                parent_id: parentId,
                created_at: new Date().toISOString()
            };

            console.log('Creating message with data:', messageData); // Debug log

            const { data: message, error: messageError } = await supabase
                .from('messages')
                .insert(messageData)
                .select('*')
                .single();

            if (messageError) {
                console.error('Message creation failed:', messageError);
                throw messageError;
            }

            // Only create direct_message entry if it's not a thread reply
            if (!parentId) {
                const { error: dmError } = await supabase
                    .from('direct_messages')
                    .insert({
                        id: message.id,
                        sender_id: user.id,
                        receiver_id: receiverId
                    });

                if (dmError) {
                    await supabase.from('messages').delete().eq('id', message.id);
                    throw dmError;
                }
            }

            return message;
        } catch (error) {
            console.error('Send direct message failed:', error);
            throw error;
        }
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
            if (!user) throw new Error('No user found');

            const { error } = await supabase
                .from('users')
                .update({
                    status,
                })
                .eq('id', user.id)

            if (error) throw error
        } catch (error) {
            console.error('Error updating status:', error)
            throw error
        }
    }, [supabase]);

    const getUsers = useCallback(async (): Promise<User[]> => {
        try {
            const user = await getPublicUser();
            if (!user) throw new Error('No user found');
            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .neq('id', user.id) // Don't include current user

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

    const subscribeToDirectMessages = useCallback(async (receiverId: string, callback: (message: MessageWithUser) => void) => {
        console.log('Starting DM subscription for receiver:', receiverId);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('No authenticated user found');
            return;
        }

        const channel = supabase
            .channel(`direct_messages:${user.id}:${receiverId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `user_id=in.(${user.id},${receiverId}) and parent_id=is.null`
                },
                async (payload) => {

                    const { data: message, error } = await supabase
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

                    if (error) {
                        console.error('Error fetching DM message:', error);
                        return;
                    }

                    // Only process messages that are not thread replies
                    if (message && !message.parent_id) {
                        callback(message as MessageWithUser);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const getChannel = useCallback(async (channelId: string) => {
        const { data } = await supabase
            .from('channels')
            .select('*')
            .eq('id', channelId)
            .single();
        return data;
    }, [supabase]);

    const getUser = useCallback(async (userId: string) => {
        const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        return data;
    }, [supabase]);

    const getMessage = useCallback(async (messageId: string) => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('id', messageId)
            .single();
        return data;
    }, [supabase]);

    const getDMContext = useCallback(async (messageId: string) => {
        const { data } = await supabase
            .from('direct_messages')
            .select('*')
            .eq('id', messageId)
            .single();
        return data;
    }, [supabase]);

    const searchMessages = useCallback(async (query: string): Promise<MessageWithUser[]> => {
        console.log('Searching messages for:', query);

        try {
            const user = await getPublicUser();
            if (!user) throw new Error('No user found');

            // First get channel messages
            const { data: channelMessages, error: channelError } = await supabase
                .from('messages')
                .select(`
                    *,
                    user:users!inner (
                        id,
                        username,
                        status
                    )
                `)
                .ilike('content', `%${query}%`)
                .not('channel_id', 'is', null)
                .limit(5);

            // Then get DM messages using a simpler query
            const { data: dmMessages, error: dmError } = await supabase
                .from('messages')
                .select(`
                    *,
                    user:users!inner (
                        id,
                        username,
                        status
                    ),
                    direct_messages!inner (
                        sender_id,
                        receiver_id
                    )
                `)
                .ilike('content', `%${query}%`)
                .is('channel_id', null)
                .in('direct_messages.sender_id', [user.id])
                .limit(5);

            // Get DM messages where user is receiver
            const { data: receivedDMs, error: receivedError } = await supabase
                .from('messages')
                .select(`
                    *,
                    user:users!inner (
                        id,
                        username,
                        status
                    ),
                    direct_messages!inner (
                        sender_id,
                        receiver_id
                    )
                `)
                .ilike('content', `%${query}%`)
                .is('channel_id', null)
                .in('direct_messages.receiver_id', [user.id])
                .limit(5);

            if (channelError) throw channelError;
            if (dmError) throw dmError;
            if (receivedError) throw receivedError;


            // Combine and sort all results
            const allMessages = [
                ...(channelMessages || []),
                ...(dmMessages || []),
                ...(receivedDMs || [])
            ].sort((a, b) =>
                new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
            ).slice(0, 5);

            return allMessages as MessageWithUser[];
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }, [supabase, getPublicUser]);

    const searchChannels = useCallback(async (query: string): Promise<Channel[]> => {
        console.log('Searching channels for:', query);
        const { data, error } = await supabase
            .from('channels')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(5);

        console.log('Channel search results:', data);
        if (error) throw error;
        return data;
    }, [supabase]);

    const searchUsers = useCallback(async (query: string): Promise<User[]> => {
        console.log('Searching users for:', query);
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .ilike('username', `%${query}%`)
            .limit(5);

        console.log('User search results:', data);
        if (error) throw error;
        return data as User[];
    }, [supabase]);

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
        uploadFile,
        subscribeToDirectMessages,
        getChannel,
        getUser,
        getMessage,
        getDMContext,
        searchMessages,
        searchChannels,
        searchUsers,
    };
}; 