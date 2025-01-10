export interface DirectMessage {
    id: string;
    content: string;
    sender_id: string;
    receiver_id: string;
    attachments: {
        file_name: string;
        file_size: number;
        file_type: string;
        url: string;
    }[];
    created_at: string;
    sender: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    receiver: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
} 