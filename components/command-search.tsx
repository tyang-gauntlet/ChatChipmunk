"use client"

import React, { useState, useEffect } from 'react'
import Fuse from 'fuse.js'
import { useRouter } from 'next/navigation'
import { SearchResult, Message, Channel, User } from '@/lib/types/search'
import { getSupabaseClient } from '@/lib/supabase/client'

const CommandSearch = () => {
    const router = useRouter()
    const supabase = getSupabaseClient()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [allData, setAllData] = useState<SearchResult[]>([])

    useEffect(() => {
        const fetchData = async () => {
            const [
                { data: messages },
                { data: channels },
                { data: users }
            ] = await Promise.all([
                supabase
                    .from('messages')
                    .select('*, users(full_name), channels(name)')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('channels')
                    .select('*'),
                supabase
                    .from('users')
                    .select('*')
            ])

            const searchResults: SearchResult[] = [
                ...(messages?.map((message: Message) => ({
                    type: 'message',
                    id: message.id,
                    title: message.content,
                    subtitle: `in #${message.channels.name} by ${message.users.full_name}`,
                    url: `/channels/${message.channel_id}?message=${message.id}`
                })) || []),
                ...(channels?.map((channel: Channel) => ({
                    type: 'channel',
                    id: channel.id,
                    title: `#${channel.name}`,
                    subtitle: channel.description || 'No description',
                    url: `/channels/${channel.id}`
                })) || []),
                ...(users?.map((user: User) => ({
                    type: 'user',
                    id: user.id,
                    title: user.full_name,
                    subtitle: user.email,
                    url: `/users/${user.id}`
                })) || [])
            ]

            setAllData(searchResults)
        }

        fetchData()
    }, [])

    useEffect(() => {
        if (!query) {
            setResults([])
            return
        }

        const fuse = new Fuse<SearchResult>(allData, {
            keys: ['title', 'subtitle'],
            threshold: 0.3
        })
        const searchResults = fuse.search(query).map(item => item.item)
        setResults(searchResults)
    }, [query, allData])

    const handleSelectResult = (result: SearchResult) => {
        if (!result.url) return
        router.push(result.url)
    }

    return (
        <div className="relative w-full p-2">
            <input
                type="text"
                aria-label="Search"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Search messages, channels, users..."
                value={query}
                onChange={e => setQuery(e.target.value)}
            />
            {results.length > 0 && (
                <ul
                    role="listbox"
                    className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-md border bg-popover p-0 shadow-md"
                >
                    {results.map(r => (
                        <li
                            key={r.id}
                            role="option"
                            tabIndex={0}
                            aria-label={r.title}
                            className="flex cursor-pointer flex-col gap-1 px-4 py-2 text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                            onClick={() => handleSelectResult(r)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleSelectResult(r)
                            }}
                        >
                            <div className="font-medium">{r.title}</div>
                            <div className="text-xs text-muted-foreground">{r.subtitle}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default CommandSearch 