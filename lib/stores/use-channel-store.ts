import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Channel } from '@/lib/types';

interface ChannelStore {
    channels: Channel[];
    currentChannel: Channel | null;
    isLoading: boolean;
    createChannel: (name: string, description: string, isPrivate: boolean) => Promise<void>;
    deleteChannel: (id: string) => Promise<void>;
    fetchChannels: () => Promise<void>;
    setCurrentChannel: (channel: Channel | null) => void;
}

export const useChannelStore = create<ChannelStore>((set, get) => ({
    channels: [],
    currentChannel: null,
    isLoading: false,

    createChannel: async (name: string, description: string, isPrivate: boolean) => {
        try {
            const { data: user } = await supabase.auth.getUser();
            if (!user.user) return;

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

            set((state) => ({
                channels: [...state.channels, data],
            }));
        } catch (error) {
            console.error('Error creating channel:', error);
            throw error;
        }
    },

    deleteChannel: async (id: string) => {
        try {
            const { error } = await supabase
                .from('channels')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set((state) => ({
                channels: state.channels.filter((channel) => channel.id !== id),
                currentChannel: state.currentChannel?.id === id ? null : state.currentChannel,
            }));
        } catch (error) {
            console.error('Error deleting channel:', error);
            throw error;
        }
    },

    fetchChannels: async () => {
        try {
            set({ isLoading: true });
            const { data, error } = await supabase
                .from('channels')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;

            set({ channels: data || [] });
        } catch (error) {
            console.error('Error fetching channels:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    setCurrentChannel: (channel) => set({ currentChannel: channel }),
})); 