// "use client"

// import { useState } from 'react'
// import { Button } from './ui/button'
// import { SendIcon } from 'lucide-react'
// import { Input } from './ui/input'
// import { useSupabase } from '@/lib/hooks/use-supabase'

// interface MessageInputProps {
//     channelId?: string
//     receiverId?: string
//     parentId?: string
// }

// export const MessageInput = ({ channelId, receiverId, parentId }: MessageInputProps) => {
//     const [message, setMessage] = useState('')
//     const { sendMessage, sendDirectMessage } = useSupabase()

//     const handleSend = async () => {
//         if (!message.trim()) return
//         try {
//             if (channelId) {
//                 await sendMessage(channelId, message, parentId)
//             } else if (receiverId) {
//                 await sendDirectMessage(receiverId, message)
//             }
//             setMessage('')
//         } catch (error) {
//             console.error('Failed to send message:', error)
//         }
//     }

//     const handleKeyDown = (e: React.KeyboardEvent) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             e.preventDefault()
//             handleSend()
//         }
//     }

//     return (
//         <div className="border rounded-md p-2 flex gap-2">
//             <Input
//                 value={message}
//                 onChange={(e) => setMessage(e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 placeholder="Type a message..."
//                 className="flex-1"
//             />
//             <Button onClick={handleSend}>
//                 <SendIcon className="h-4 w-4" />
//             </Button>
//         </div>
//     )
// } 