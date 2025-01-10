"use client"

import { useState } from 'react'
import { Button } from './ui/button'
import { SendIcon } from 'lucide-react'
import { Input } from './ui/input'
import { useSupabase } from '@/lib/hooks/use-supabase-actions'

interface MessageInputProps {
    channelId?: string | null
    parentId?: string | null
}

export const MessageInput = ({ channelId = null, parentId = null }: MessageInputProps) => {
    const [message, setMessage] = useState('')
    const { sendMessage } = useSupabase()

    const handleSubmit = async (content: string) => {
        try {
            await sendMessage(content, channelId || undefined, parentId || undefined)
            setMessage('')
        } catch (error) {
            console.error('Error sending message:', error)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(message)
        }
    }

    return (
        <div className="border rounded-md p-2 flex gap-2">
            <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1"
            />
            <Button onClick={() => handleSubmit(message)}>
                <SendIcon className="h-4 w-4" />
            </Button>
        </div>
    )
} 