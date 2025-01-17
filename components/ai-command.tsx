"use client"

import { useState } from 'react'
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Loader2 } from 'lucide-react'

interface AICommandProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AICommand({ open, onOpenChange }: AICommandProps) {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<string | null>(null);

    const handleCommandSubmit = async (finalInput: string) => {
        if (!finalInput.trim()) return;

        setIsLoading(true);
        setResponse(null);
        try {
            const response = await fetch('http://44.204.108.174:8000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: finalInput
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response from AI');
            }

            const data = await response.json();
            console.log('AI Response:', data);
            setResponse(data.response || data.message || JSON.stringify(data));
        } catch (error) {
            console.error('Error calling AI:', error);
            setResponse('Error: Failed to get response from AI');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <div className="relative">
                <CommandInput
                    placeholder="Ask AI..."
                    value={input}
                    onValueChange={setInput}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleCommandSubmit(input);
                        }
                    }}
                />
            </div>
            <CommandList className="max-h-[300px] overflow-y-auto">
                {!input.trim() && !isLoading && !response ? (
                    <CommandEmpty>
                        <div className="flex flex-col gap-1">
                            <div>
                                <span>Ask AI about the messages in channels</span>
                            </div>
                            <div>
                                <span>OR</span>
                            </div>
                            <div>
                                <span className="font-mono text-muted-foreground">/file</span>
                                <span className="text-muted-foreground"> Ask about a file</span>
                            </div>
                            <div>
                                <span className="font-mono text-muted-foreground">/fake</span>
                                <span className="text-muted-foreground"> [username] [prompt]</span>
                            </div>
                        </div>
                    </CommandEmpty>
                ) : (
                    <CommandGroup>
                        {isLoading && (
                            <CommandItem disabled>
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            </CommandItem>
                        )}
                        {response && (
                            <CommandItem disabled className="whitespace-pre-wrap">
                                {response}
                            </CommandItem>
                        )}
                    </CommandGroup>
                )}
            </CommandList>
        </CommandDialog>
    );
} 