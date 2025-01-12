"use client"

import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/user-nav"
import { ChannelList } from "@/components/channel-list"
import { DirectMessageList } from "@/components/direct-message-list"
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
import { useState, useEffect, Suspense } from "react"
import { MessageInput } from '@/components/message-input'
import { MessageList } from '@/components/message-list'
import { Plus } from "lucide-react"
import { CreateChannelDialog } from "@/components/create-channel-dialog"
import { useSupabase } from "@/hooks/use-supabase-actions"
import { ThreadHeader } from "@/components/thread-header"
import { User, Channel, MessageWithUser } from '@/lib/types/chat.types'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from "@/lib/supabase/client"

interface MessageTarget {
  channelId?: string;
  receiverId?: string;
  parentId?: string;
}

// Create a wrapped version of the main content
const ChatContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get params from URL
  const channelId = searchParams.get('channel')
  const userId = searchParams.get('dm')
  const messageId = searchParams.get('message')

  const [open, setOpen] = useState(false)
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [parentMessage, setParentMessage] = useState<MessageWithUser | null>(null)
  const { getChannelMessages, getDirectMessages } = useSupabase()
  const supabase = getSupabaseClient()

  // Update URL when selection changes
  const handleChannelSelect = (channel: Channel) => {
    setCurrentChannel(channel)
    setSelectedUser(null)
    setSelectedThread(null)
    router.push(`/?channel=${channel.id}`)
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setCurrentChannel(null)
    setSelectedThread(null)
    router.push(`/?dm=${user.id}`)
  }

  const handleThreadSelect = async (messageId: string) => {
    setSelectedThread(messageId);
    // Update URL to include message ID
    const baseUrl = currentChannel
      ? `/?channel=${currentChannel.id}`
      : selectedUser
        ? `/?dm=${selectedUser.id}`
        : '/';
    router.push(`${baseUrl}&message=${messageId}`);

    try {
      let messages;
      if (currentChannel) {
        messages = await getChannelMessages(currentChannel.id);
      } else if (selectedUser) {
        messages = await getDirectMessages(selectedUser.id);
      }

      if (messages) {
        const parent = messages.find(m => m.id === messageId);
        if (parent) {
          setParentMessage(parent);
        }
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
    }
  };

  // Load initial state from URL
  useEffect(() => {
    const loadFromUrl = async () => {
      try {
        if (channelId) {
          const { data: channel } = await supabase
            .from('channels')
            .select('*')
            .eq('id', channelId)
            .single();
          if (channel) {
            setCurrentChannel(channel);
          }
        } else if (userId) {
          const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
          if (user) {
            setSelectedUser(user);
          }
        }

        if (messageId) {
          handleThreadSelect(messageId);
        }
      } catch (error) {
        console.error('Error loading from URL:', error);
      }
    };

    loadFromUrl();
  }, [channelId, userId, messageId]);

  // Helper function to determine message target
  const getMessageTarget = (): MessageTarget => {
    if (selectedThread) {
      if (currentChannel?.id) {
        return {
          channelId: currentChannel.id,
          parentId: selectedThread
        };
      }
      if (selectedUser?.id) {
        return {
          receiverId: selectedUser.id,
          parentId: selectedThread
        };
      }
    }

    if (selectedUser?.id) {
      return {
        receiverId: selectedUser.id
      };
    }

    if (currentChannel?.id) {
      return {
        channelId: currentChannel.id
      };
    }

    return {};
  };

  // Update URL when thread is closed
  const handleThreadClose = () => {
    setSelectedThread(null);
    setParentMessage(null);
    const baseUrl = currentChannel
      ? `/?channel=${currentChannel.id}`
      : selectedUser
        ? `/?dm=${selectedUser.id}`
        : '/';
    router.push(baseUrl);
  };

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
                <Collapsible defaultOpen>
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
                    <ChannelList onChannelSelect={handleChannelSelect} />
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
                    <DirectMessageList onUserSelect={(user: User) => handleUserSelect(user)} />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Message Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="border-b p-4">
            <h2 className="font-semibold">
              {currentChannel
                ? `# ${currentChannel.name}`
                : selectedUser
                  ? `💬 ${selectedUser.username}`
                  : 'Select a channel or user'}
            </h2>
          </div>

          {/* Messages */}
          {(currentChannel || selectedUser) ? (
            <div className="flex-1 flex min-h-0">
              <div className="flex-1 flex flex-col">
                <MessageList
                  channelId={currentChannel?.id}
                  receiverId={selectedUser?.id}
                  onReply={handleThreadSelect}
                  highlightId={messageId || undefined}
                />
                <MessageInput
                  {...getMessageTarget()}
                  onMessageSent={() => {
                    const messageList = document.querySelector('.message-list');
                    if (messageList) {
                      messageList.scrollTo({
                        top: messageList.scrollHeight,
                        behavior: 'smooth'
                      });
                    }
                  }}
                />
              </div>

              {selectedThread && (
                <div className="w-96 border-l flex flex-col">
                  <ThreadHeader
                    onClose={handleThreadClose}
                    parentMessage={parentMessage}
                  />
                  <div className="flex-1 flex flex-col min-h-0">
                    <MessageList
                      channelId={currentChannel?.id}
                      parentId={selectedThread}
                      receiverId={selectedUser?.id}
                      highlightId={messageId || undefined}
                    />
                    <MessageInput {...getMessageTarget()} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a channel or user to start messaging
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// Update the default export to use Suspense
export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-screen w-full items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  )
}

