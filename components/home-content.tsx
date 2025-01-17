"use client"

import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/user-nav"
import { ChannelList } from "@/components/channel-list"
import { DirectMessageList } from "@/components/direct-message-list"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { MessageInput } from '@/components/message-input'
import { MessageList } from '@/components/message-list'
import { CreateChannelDialog } from "@/components/create-channel-dialog"
import { useSupabase } from "@/hooks/use-supabase-actions"
import { ThreadHeader } from "@/components/thread-header"
import { User, Channel, MessageWithUser } from '@/lib/types/chat.types'
import { useRouter, useSearchParams } from 'next/navigation'
import { CommandSearch } from '@/components/command-search'
import { SparkleButton } from '@/components/sparkle-button'
import { AICommand } from '@/components/ai-command'

interface MessageTarget {
    channelId?: string;
    receiverId?: string;
    parentId?: string;
}

export function HomeContent() {
    const router = useRouter();
    const searchParams = useSearchParams()
    const [searchOpen, setSearchOpen] = useState(false)
    const [aiCommandOpen, setAiCommandOpen] = useState(false)
    const [open, setOpen] = useState(false)
    const [selectedThread, setSelectedThread] = useState<string | null>(null)
    const [currentChannel, setCurrentChannel] = useState<Channel | null>(null)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [parentMessage, setParentMessage] = useState<MessageWithUser | null>(null)
    const { getChannelMessages, getDirectMessages, getChannel, getUser, getMessage, getDMContext, getPublicUser } = useSupabase()

    // URL state management
    const updateUrl = (params: { channelId?: string; userId?: string; messageId?: string }) => {
        const url = new URLSearchParams();
        if (params.channelId) url.set('channelId', params.channelId);
        if (params.userId) url.set('userId', params.userId);
        if (params.messageId) url.set('messageId', params.messageId);
        router.push(`/?${url.toString()}`, { scroll: false });
    };

    const handleChannelSelect = (channel: Channel) => {
        setCurrentChannel(channel);
        setSelectedUser(null);
        setSelectedThread(null);
        updateUrl({ channelId: channel.id });
    };

    const handleUserSelect = (user: User) => {
        setSelectedUser(user);
        setCurrentChannel(null);
        setSelectedThread(null);
        updateUrl({ userId: user.id });
    };

    const handleThreadSelect = async (messageId: string) => {
        setSelectedThread(messageId);

        const urlParams: { channelId?: string; userId?: string; messageId: string } = {
            messageId
        };

        if (currentChannel) {
            urlParams.channelId = currentChannel.id;
        } else if (selectedUser) {
            urlParams.userId = selectedUser.id;
        }

        updateUrl(urlParams);

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

    const handleThreadClose = () => {
        setSelectedThread(null);
        setParentMessage(null);
        if (currentChannel) {
            updateUrl({ channelId: currentChannel.id });
        } else if (selectedUser) {
            updateUrl({ userId: selectedUser.id });
        } else {
            updateUrl({});
        }
    };

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

    useEffect(() => {
        const initializeFromUrl = async () => {
            try {
                const channelId = searchParams.get('channelId')
                const userId = searchParams.get('userId')
                const messageId = searchParams.get('messageId')

                if (messageId) {
                    const message = await getMessage(messageId);
                    if (message) {
                        if (message.channel_id) {
                            const channel = await getChannel(message.channel_id);
                            if (channel) {
                                setCurrentChannel(channel);
                                setSelectedUser(null);
                            }
                        } else {
                            const dmContext = await getDMContext(message.id);
                            if (dmContext) {
                                const senderId = dmContext.sender_id;
                                const receiverId = dmContext.receiver_id;
                                if (!senderId || !receiverId) throw new Error('No sender or receiver found');

                                const user = await getUser(senderId === message.user_id ? receiverId : senderId);
                                if (user) {
                                    setSelectedUser(user);
                                    setCurrentChannel(null);
                                }
                            }
                        }
                        setSelectedThread(messageId);
                        setParentMessage(message as MessageWithUser);
                    }
                } else if (channelId) {
                    const channel = await getChannel(channelId);
                    if (channel) {
                        setCurrentChannel(channel);
                        setSelectedUser(null);
                        setSelectedThread(null);
                    }
                } else if (userId) {
                    const user = await getUser(userId);
                    if (user) {
                        setSelectedUser(user);
                        setCurrentChannel(null);
                        setSelectedThread(null);
                    }
                }
            } catch (error) {
                console.error('Error initializing from URL:', error);
            }
        };

        initializeFromUrl();
    }, [searchParams]);

    const handleSearchSelect = (result: { type: string; id: string }) => {
        switch (result.type) {
            case 'channel':
                getChannel(result.id).then(channel => {
                    if (channel) handleChannelSelect(channel);
                });
                break;
            case 'message':
                getMessage(result.id).then(async message => {
                    if (!message) return;

                    if (message.channel_id) {
                        const channel = await getChannel(message.channel_id);
                        if (!channel) return;
                        handleChannelSelect(channel);
                    } else {
                        const dmContext = await getDMContext(message.id);
                        if (!dmContext) return;

                        const currentUser = await getPublicUser();
                        if (!currentUser) return;

                        const otherUserId = dmContext.sender_id === currentUser.id
                            ? dmContext.receiver_id
                            : dmContext.sender_id;

                        if (!otherUserId) throw new Error('No other user found');

                        const otherUser = await getUser(otherUserId);
                        if (!otherUser) return;
                        handleUserSelect(otherUser);
                    }

                    setTimeout(() => {
                        const messageElement = document.getElementById(`message-${message.id}`);
                        if (!messageElement) return;

                        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        messageElement.classList.add('highlight-message');
                        setTimeout(() => messageElement.classList.remove('highlight-message'), 2000);
                    }, 500);
                });
                break;
            case 'user':
                getUser(result.id).then(user => {
                    if (user) handleUserSelect(user);
                });
                break;
        }
        setOpen(false);
    };

    return (
        <div className="flex flex-col h-screen w-full">
            <header className="border-b h-14 flex items-center px-6 justify-between bg-background z-10 w-full">
                <h1 className="font-semibold">ChatChipmunk</h1>
                <div className="flex items-center gap-4">
                    <SparkleButton onClick={() => setAiCommandOpen(true)} />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => setSearchOpen(true)}
                    >
                        <Search className="h-4 w-4" />
                        <span className="sr-only">Search</span>
                    </Button>
                    <ModeToggle />
                    <UserNav />
                </div>
            </header>

            <AICommand
                open={aiCommandOpen}
                onOpenChange={setAiCommandOpen}
            />

            <CommandSearch
                open={searchOpen}
                onOpenChange={setSearchOpen}
                onSelect={handleSearchSelect}
            />

            <div className="flex flex-1 min-h-0">
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

                <main className="flex-1 flex flex-col min-w-0">
                    <div className="border-b p-4">
                        <h2 className="font-semibold">
                            {currentChannel
                                ? `# ${currentChannel.name}`
                                : selectedUser
                                    ? `💬 ${selectedUser.username}`
                                    : 'Select a channel or user'}
                        </h2>
                    </div>

                    {(currentChannel || selectedUser) ? (
                        <div className="flex-1 flex min-h-0">
                            <div className="flex-1 flex flex-col">
                                <MessageList
                                    channelId={currentChannel?.id}
                                    receiverId={selectedUser?.id}
                                    onReply={handleThreadSelect}
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