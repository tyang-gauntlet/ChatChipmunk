"use client"

import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/user-nav"
import { ChannelList } from "@/components/channel-list"
// import { DirectMessageList } from "@/components/direct-message-list"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Search } from "lucide-react"
import { useState, useEffect } from "react"
// import { MessageInput } from '@/components/message-input'
// import { MessageList } from '@/components/message-list'
import { Plus } from "lucide-react"
import { CreateChannelDialog } from "@/components/create-channel-dialog"

export default function Home() {
  const [open, setOpen] = useState(false)
  const [selectedThread, setSelectedThread] = useState<string | null>(null)

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Header - simplified with icon */}
      <header className="border-b h-14 flex items-center px-6 justify-between bg-background z-10 w-full">
        <h1 className="font-semibold">ChatChipmunk</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={() => setOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
          <ModeToggle />
          <UserNav />
        </div>
      </header>

      {/* CommandDialog remains the same but moves outside header */}
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

      {/* Main content area with sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-64 border-r flex flex-col">
          <ScrollArea className="flex-1">
            <div className="space-y-4 py-4">
              <div className="px-3 py-2">
                <Collapsible>
                  <div className="flex items-center justify-between px-4 py-1">
                    <CollapsibleTrigger className="flex items-center hover:bg-accent rounded-md">
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 collapsible-rotate" />
                      <h2 className="text-sm font-semibold ml-1.5">Channels</h2>
                    </CollapsibleTrigger>
                    <CreateChannelDialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label="Create channel"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CreateChannelDialog>
                  </div>
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
                    {/* <DirectMessageList /> */}
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

          <div className="flex-1 flex min-h-0">
            <div className="flex-1 flex flex-col">
              {/* <MessageList
                channelId="current-channel-id"
                onReply={(messageId) => setSelectedThread(messageId)}
              />
              <MessageInput
                channelId="current-channel-id"
              /> */}
            </div>

            {selectedThread && (
              <div className="w-96 border-l flex flex-col">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Thread</h3>
                </div>
                {/* <MessageList
                  parentId={selectedThread}
                  onReply={() => { }}
                />
                <MessageInput
                  channelId="current-channel-id"
                  parentId={selectedThread}
                /> */}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

