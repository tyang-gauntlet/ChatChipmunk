"use client"

import { ModeToggle } from "@/components/mode-toggle"
import { CommandSearch } from "@/components/command-search"
import { UserNav } from "@/components/user-nav"
import { ChannelList } from "@/components/channel-list"
import { DirectMessageList } from "@/components/direct-message-list"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import { Search } from "lucide-react"
import { useState, useEffect } from "react"

export default function Home() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Header - now at the very top */}
      <header className="border-b h-14 flex items-center px-6 justify-between bg-background z-10 w-full">
        <h1 className="font-semibold">ChatChipmunk</h1>
        <div className="flex-1 max-w-2xl mx-4">
          <Button
            variant="outline"
            className="relative w-full justify-start text-sm text-muted-foreground"
            onClick={() => setOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            Search channels and messages...
            <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              ⌘K
            </kbd>
          </Button>
          <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Search channels and messages..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Channels">
                <CommandItem># general</CommandItem>
                <CommandItem># random</CommandItem>
              </CommandGroup>
              <CommandGroup heading="Messages">
                <CommandItem>Message from John</CommandItem>
                <CommandItem>Message from Sarah</CommandItem>
              </CommandGroup>
            </CommandList>
          </CommandDialog>
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle />
          <UserNav />
        </div>
      </header>

      {/* Main content area with sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-64 border-r flex flex-col">
          <ScrollArea className="flex-1">
            <div className="space-y-4 py-4">
              <div className="px-3 py-2">
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center w-full px-4 py-1 hover:bg-accent rounded-md">
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 collapsible-rotate" />
                    <h2 className="text-sm font-semibold ml-1.5">Channels</h2>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1">
                    <ChannelList />
                  </CollapsibleContent>
                </Collapsible>
              </div>
              <div className="px-3 py-2">
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center w-full px-4 py-1 hover:bg-accent rounded-md">
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 collapsible-rotate" />
                    <h2 className="text-sm font-semibold ml-1.5">Direct Messages</h2>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1">
                    <DirectMessageList />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Message Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Channel/User header */}
          <div className="border-b p-4">
            <h2 className="font-semibold"># general</h2>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {/* Messages will go here */}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="border-t p-4">
            {/* MessageInput component will go here */}
          </div>
        </main>
      </div>
    </div>
  )
}

