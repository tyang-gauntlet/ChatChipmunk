import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useCallback, useState } from 'react'
import type { SearchResult, Message, Channel, User } from '@/lib/types/search'
import type { Database } from '@/lib/database.types'

export const useSearch = () => {
    const supabase = createClientComponentClient<Database>()
    const [results, setResults] = useState<SearchResult[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const searchQuery = useCallback(async (query: string) => {
        if (!query || query.length < 2) {
            setResults([])
            return
        }

        setIsLoading(true)
        try {
            const [messagesResponse, channelsResponse, usersResponse] = await Promise.all([
                supabase
                    .from('messages')
                    .select(`
            id,
            content,
            channel_id,
            parent_id,
            users!inner(full_name),
            channels!inner(name)
          `)
                    .ilike('content', `%${query}%`)
                    .limit(5),

                supabase
                    .from('channels')
                    .select('id, name, description')
                    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
                    .limit(5),

                supabase
                    .from('users')
                    .select('id, full_name, email')
                    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
                    .limit(5)
            ])

            const messages = (messagesResponse.data || []) as Message[]
            const channels = (channelsResponse.data || []) as Channel[]
            const users = (usersResponse.data || []) as User[]

            const formattedResults: SearchResult[] = [
                ...messages.map(msg => ({
                    type: msg.parent_id ? 'thread' : 'message',
                    id: msg.id,
                    title: msg.content.substring(0, 50),
                    subtitle: `in #${msg.channels.name} by ${msg.users.full_name}`,
                    url: msg.parent_id
                        ? `/channels/${msg.channel_id}?thread=${msg.parent_id}`
                        : `/channels/${msg.channel_id}?message=${msg.id}`
                })),
                ...channels.map(channel => ({
                    type: 'channel',
                    id: channel.id,
                    title: `#${channel.name}`,
                    subtitle: channel.description || '',
                    url: `/channels/${channel.id}`
                })),
                ...users.map(user => ({
                    type: 'user',
                    id: user.id,
                    title: user.full_name,
                    subtitle: user.email,
                    url: `/dm/${user.id}`
                }))
            ]

            setResults(formattedResults)
        } catch (error) {
            console.error('Search error:', error)
            setResults([])
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    return { searchQuery, results, isLoading }
} 