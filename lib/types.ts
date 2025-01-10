export interface Message {
    id: string;
    content: string;
    attachments: {
        file_name: string;
        file_size: number;
        file_type: string;
        url: string;
    }[];
    created_at: string;
    user: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    reactions: {
        id: string;
        emoji: string;
        users: {
            id: string;
            full_name: string;
        }[];
    }[];
    threads?: Message[];
}

export interface Channel {
    id: string;
    name: string;
    description?: string;
    is_private: boolean;
    created_by?: string;
    created_at?: string;
}

export interface User {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    last_seen: string | null;
    status: string | null;
    created_at: string;
}

export interface DBUser {
    id: string;
    email: string;
    created_at: string;
    last_seen: string;
    status: string;
    full_name: string;
    avatar_url: string;
    is_online: boolean;
}

export interface SearchResult {
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

export interface Reaction {
    id: string;
    emoji: string;
    users: {
        id: string;
        fullName: string;
    }[];
} 