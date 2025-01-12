import { Database } from './database.types'

export type User = Database['public']['Tables']['users']['Row']
export type Channel = Database['public']['Tables']['channels']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Reaction = Database['public']['Tables']['reactions']['Row']
export type ChannelMember = Database['public']['Tables']['channel_members']['Row']
export type DirectMessage = Database['public']['Tables']['direct_messages']['Row']

// Commonly used combinations
export type MessageWithUser = Message & {
    user?: {
        id: string;
        username: string;
        status: string | null;
    };
    reactions?: {
        id: string;
        emoji: string;
        user: {
            id: string;
            username: string;
        };
    }[];
    threads?: Message[];
}

export type ChannelWithMembers = Channel & {
    channel_members: {
        user_id: string | null;
    }[];
} 