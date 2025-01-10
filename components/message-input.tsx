"use client"

import { useState } from 'react'
import { Button } from './ui/button'
import { SendIcon } from 'lucide-react'
import { Input } from './ui/input'

interface MessageInputProps {
    channelId?: string
    receiverId?: string
    parentId?: string
    onSend: (content: string, attachments: any[]) => Promise<void>
}

export const MessageInput = ({ onSend }: MessageInputProps) => {
    const [message, setMessage] = useState('')

    const handleSend = async () => {
        if (!message.trim()) return
        await onSend(message, [])
        setMessage('')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
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
            <Button onClick={handleSend}>
                <SendIcon className="h-4 w-4" />
            </Button>
        </div>
    )
} 