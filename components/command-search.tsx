"use client"

import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { useState } from "react"

export function CommandSearch() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button
                variant="outline"
                className="w-full justify-start text-muted-foreground"
                onClick={() => setOpen(true)}
            >
                <Search className="mr-2 h-4 w-4" />
                Search...
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Search all channels and messages..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Channels">
                        {/* Channel results will go here */}
                    </CommandGroup>
                    <CommandGroup heading="Messages">
                        {/* Message results will go here */}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    )
} 