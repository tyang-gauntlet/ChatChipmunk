export type Database = {
    public: {
        Tables: {
            messages: {
                Row: {
                    id: string
                    content: string
                    channel_id: string
                    parent_id: string | null
                    user_id: string
                    created_at: string
                }
            }
            channels: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                }
            }
            users: {
                Row: {
                    id: string
                    full_name: string
                    email: string
                }
            }
        }
    }
} 