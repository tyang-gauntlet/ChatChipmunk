"use client"

import { useState, useRef } from 'react'
import { useSupabase } from '@/hooks/use-supabase-actions'
import { getSupabaseClient } from '@/lib/supabase/client'

interface MessageInputProps {
    channelId?: string
    parentId?: string
    receiver_id?: string
}

export const MessageInput = ({ channelId, parentId, receiver_id }: MessageInputProps) => {
    const [content, setContent] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = getSupabaseClient()
    const { uploadFile, getPublicUser } = useSupabase()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files) {
            setSelectedFiles(Array.from(files))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim() && selectedFiles.length === 0) return

        try {
            let attachments: { file_name: string; file_size: number; file_type: string; url: string }[] = []

            // Handle file uploads if any
            if (selectedFiles.length > 0) {
                setIsUploading(true)
                attachments = await Promise.all(selectedFiles.map(uploadFile))
            }

            const user = await getPublicUser()
            if (!user) throw new Error('User not found')

            // Create message with attachments
            const { error } = await supabase
                .from('messages')
                .insert({
                    user_id: user.id,
                    content: content.trim(),
                    channel_id: channelId || null,
                    parent_id: parentId || null,
                    attachments: attachments
                })

            if (error) throw error

            // Reset form
            setContent('')
            setSelectedFiles([])
            if (fileInputRef.current) fileInputRef.current.value = ''
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={isUploading}
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-md bg-secondary p-2 hover:bg-secondary/80"
                    disabled={isUploading}
                >
                    <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                    </svg>
                </button>
                <button
                    type="submit"
                    className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                    disabled={isUploading || (!content.trim() && selectedFiles.length === 0)}
                >
                    {isUploading ? 'Uploading...' : 'Send'}
                </button>
            </div>
            {selectedFiles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 rounded-md bg-secondary/50 px-2 py-1 text-sm"
                        >
                            <span>{file.name}</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedFiles(files => files.filter((_, i) => i !== index))
                                }}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </form>
    )
}

export default MessageInput 