export interface Message {
    id: string;
    content: string;
    attachments: any[];
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