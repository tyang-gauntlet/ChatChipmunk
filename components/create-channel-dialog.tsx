"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/lib/hooks/use-supabase-actions';

interface CreateChannelDialogProps {
    children: React.ReactNode;
}

export const CreateChannelDialog = ({ children }: CreateChannelDialogProps) => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const { toast } = useToast();
    const { createChannel } = useSupabase();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createChannel(name, description);
            toast({
                title: 'Success',
                description: `Channel #${name} created successfully`,
            });
            setOpen(false);
            setName('');
            setDescription('');
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create channel',
                variant: 'destructive',
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a new channel</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Channel name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. marketing"
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">Create Channel</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}; 