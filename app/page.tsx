"use client"

import { ModeToggle } from "@/components/mode-toggle"
import { CommandSearch } from "@/components/command-search"
import { UserNav } from "@/components/user-nav"
import { ChannelList } from "@/components/channel-list"
import { DirectMessageList } from "@/components/direct-message-list"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export default function Home() {
  return (
    <div className="flex flex-col h-screen w-full">
      {/* Header - now at the very top */}
      <header className="border-b h-14 flex items-center px-6 justify-between bg-background z-10 w-full">
        <h1 className="font-semibold">ChatChipmunk</h1>
        <div className="flex-1 max-w-2xl mx-4">
          <CommandSearch />
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
                <h2 className="mb-2 px-4 text-lg font-semibold">Channels</h2>
                <ChannelList />
              </div>
              <Separator className="mx-3" />
              <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-lg font-semibold">Direct Messages</h2>
                <DirectMessageList />
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

