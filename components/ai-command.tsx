"use client"

import { useState } from 'react'
import {
    CommandDialog,
    CommandEmpty,
    CommandInput,
    CommandList,
} from "@/components/ui/command"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Loader2, X } from 'lucide-react'

interface AICommandProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AICommand({ open, onOpenChange }: AICommandProps) {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<string | null>(null);
    const [showResponse, setShowResponse] = useState(false);

    const handleCommandSubmit = async (finalInput: string) => {
        if (!finalInput.trim()) return;

        setIsLoading(true);
        setResponse(null);
        onOpenChange(false); // Close command dialog
        setShowResponse(true); // Open response dialog

        try {
            // In your frontend code where you make the API call
            const API_URL = process.env.NODE_ENV === 'production'
                ? 'https://44.204.108.174:8000'  // Force HTTP in production
                : 'http://localhost:8000';       // Local development
            const response = await fetch(API_URL + '/chat', {
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
            setResponse(data.content);
        } catch (error) {
            console.error('Error calling AI:', error);
            setResponse('Error: Failed to get response from AI');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
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
                <CommandList>
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
                                <span className="text-muted-foreground"> Ask about a file (coming soon)</span>
                            </div>
                            <div>
                                <span className="font-mono text-muted-foreground">/fake</span>
                                <span className="text-muted-foreground"> [username] [prompt]</span>
                            </div>
                        </div>
                    </CommandEmpty>
                </CommandList>
            </CommandDialog>

            <Dialog open={showResponse} onOpenChange={setShowResponse}>
                <DialogContent className="sm:max-w-[500px]">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">AI Response</h2>
                    </div>
                    {isLoading ? (
                        <div className="flex items-center gap-2 p-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>AI is thinking...</span>
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="pt-4">
                                <div className="whitespace-pre-wrap text-sm">{response}</div>
                            </CardContent>
                        </Card>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
} 