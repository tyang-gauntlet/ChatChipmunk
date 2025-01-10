export interface Attachment {
    id: string
    message_id: string
    file_name: string
    file_size: number
    file_type: string
    url: string
}

export interface Message {
    id: string
    content: string
    channel_id: string
    parent_id: string | null
    users: {
        full_name: string
    }
    channels: {
        name: string
    }
}

export interface Channel {
    id: string
    name: string
    description: string | null
}

export interface User {
    id: string
    full_name: string
    email: string
}

export interface SearchResult {
    type: 'message' | 'channel' | 'user' | 'thread'
    id: string
    title: string
    subtitle: string
    url: string
} 