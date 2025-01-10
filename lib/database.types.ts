export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    full_name: string
                    avatar_url: string | null
                    last_seen: string | null
                    status: string | null
                    created_at: string
                }
            }
            channels: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    is_private: boolean
                    created_by: string
                    created_at: string
                }
            }
            messages: {
                Row: {
                    id: string
                    channel_id: string
                    user_id: string
                    content: string
                    attachments: any | null
                    parent_id: string | null
                    created_at: string
                    updated_at: string
                }
            }
            reactions: {
                Row: {
                    id: string
                    message_id: string
                    user_id: string
                    emoji: string
                    created_at: string
                }
            }
            channel_members: {
                Row: {
                    channel_id: string
                    user_id: string
                    joined_at: string
                }
            }
            direct_messages: {
                Row: {
                    id: string
                    sender_id: string
                    receiver_id: string
                    content: string
                    attachments: any | null
                    created_at: string
                    updated_at: string
                }
            }
        }
    }
} 