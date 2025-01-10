"use client"

import { MessageSquare, X } from "lucide-react"
import { Button } from "./ui/button"
import { Message } from "@/lib/types"

interface ThreadHeaderProps {
    onClose: () => void
    parentMessage: Message | null
}

export const ThreadHeader = ({ onClose, parentMessage }: ThreadHeaderProps) => {
    return (
        <>
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <h3 className="font-semibold">{parentMessage?.content || 'Thread'}</h3>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onClose}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close thread</span>
                </Button>
            </div>
        </>
    )
} 