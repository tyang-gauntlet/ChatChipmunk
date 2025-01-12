"use client"

import { useState, useEffect } from 'react'
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { useSupabase } from '@/hooks/use-supabase-actions'
import { Channel, MessageWithUser, User } from '@/lib/types/chat.types'
import { format } from 'date-fns'
import { Hash, MessageSquare, User as UserIcon } from 'lucide-react'

interface SearchResult {
    type: 'channel' | 'message' | 'user';
    id: string;
    title: string;
    subtitle?: string;
    timestamp?: string;
}

interface CommandSearchProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (result: SearchResult) => void;
}

export function CommandSearch({ open, onOpenChange, onSelect }: CommandSearchProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [allResults, setAllResults] = useState<SearchResult[]>([]);
    const { searchMessages, searchChannels, searchUsers } = useSupabase();

    // Handle search query changes
    useEffect(() => {
        const performSearch = async () => {
            try {
                const [messages, channels, users] = await Promise.all([
                    searchMessages(searchQuery),
                    searchChannels(searchQuery),
                    searchUsers(searchQuery)
                ]);

                const results: SearchResult[] = [
                    ...channels.map((channel: Channel) => ({
                        type: 'channel',
                        id: channel.id,
                        title: channel.name,
                    })),
                    ...messages.map((message: MessageWithUser) => ({
                        type: 'message',
                        id: message.id,
                        title: message.content,
                        subtitle: `by ${message?.user?.username}`,
                        timestamp: format(new Date(message.created_at || ''), 'MMM d, yyyy')
                    })),
                    ...users.map((user: User) => ({
                        type: 'user',
                        id: user.id,
                        title: user.username,
                        subtitle: `Status: ${user.status || 'offline'}`
                    }))
                ];

                setAllResults(results);
            } catch (error) {
                console.error('Error searching:', error);
                setAllResults([]);
            }
        };

        const debounceTimeout = setTimeout(performSearch, 300);
        return () => clearTimeout(debounceTimeout);
    }, [searchQuery]);

    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setSearchQuery('');
            setAllResults([]);
        }
    }, [open]);

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput
                placeholder="Search channels, messages, and users..."
                value={searchQuery}
                onValueChange={setSearchQuery}
            />
            <CommandList className="max-h-[300px] overflow-y-auto">
                {!searchQuery.trim() ? (
                    <CommandEmpty>Type to search...</CommandEmpty>
                ) : allResults.length === 0 ? (
                    <CommandEmpty>No results found.</CommandEmpty>
                ) : (
                    <>
                        {allResults.some(r => r.type === 'channel') && (
                            <CommandGroup heading="Channels">
                                {allResults
                                    .filter(r => r.type === 'channel')
                                    .map(result => (
                                        <CommandItem
                                            key={result.id}
                                            onSelect={() => onSelect(result)}
                                        >
                                            <Hash className="mr-2 h-4 w-4" />
                                            <span>{result.title}</span>
                                        </CommandItem>
                                    ))}
                            </CommandGroup>
                        )}
                        <CommandGroup heading="Messages">
                            {allResults
                                .filter(r => r.type === 'message')
                                .map(result => (
                                    <CommandItem
                                        key={result.id}
                                        value={result.title} // Use content for filtering
                                        onSelect={() => onSelect(result)}
                                    >
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        <div className="flex flex-col">
                                            <span className="truncate">{result.title}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {result.subtitle} • {result.timestamp}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                        </CommandGroup>
                        <CommandGroup heading="Users">
                            {allResults
                                .filter(r => r.type === 'user')
                                .map(result => (
                                    <CommandItem
                                        key={result.id}
                                        value={result.title} // Use username for filtering
                                        onSelect={() => onSelect(result)}
                                    >
                                        <UserIcon className="mr-2 h-4 w-4" />
                                        <div className="flex flex-col">
                                            <span>{result.title}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {result.subtitle}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                        </CommandGroup>
                    </>
                )}
            </CommandList>
        </CommandDialog>
    );
}