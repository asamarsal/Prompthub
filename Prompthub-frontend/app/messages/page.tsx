"use client";

import { useState, useEffect } from "react";
import { fetchConversations, fetchMessages, searchUsers, sendMessage, fetchConnections, sendFriendRequest, acceptFriendRequest, removeFriendConnection } from "@/lib/api";
import { getEcho } from "@/lib/echo";
import { useWallet } from "@/lib/wallet-context";
import { Search, Send, User, Check, Clock, UserPlus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Navigation } from "@/components/navigation";

export default function MessagesPage() {
    const { address, isConnected } = useWallet();
    const [conversations, setConversations] = useState<any[]>([]);
    const [connections, setConnections] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [viewMode, setViewMode] = useState<"chats" | "requests">("chats");

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Load initial data
    useEffect(() => {
        if (isConnected && address) {
            fetchConversations().then(setConversations);
            fetchConnections().then(setConnections);
        }
    }, [isConnected, address]);

    // Load messages when selecting user
    useEffect(() => {
        if (!selectedUser || !address) return;

        // Fetch History
        fetchMessages(selectedUser.stx_address).then(setMessages);

        // Echo webSockets
        const echo = getEcho();
        if (!echo) return;

        const channel = echo.private(`chat.${address}`);
        channel.listen('MessageSent', (e: any) => {
            // Append if it's from the selected user
            if (e.message.sender_address === selectedUser.stx_address) {
                setMessages(prev => [...prev, e.message]);
            }

            // Update conversations list summary
            setConversations(prev => {
                const existing = prev.find(c => c.sender_address === e.message.sender_address || c.receiver_address === e.message.sender_address);
                if (existing) {
                    return prev.map(c => c.id === existing.id ? e.message : c);
                }
                return [e.message, ...prev];
            });
        });

        return () => {
            channel.stopListening('MessageSent');
        };
    }, [selectedUser, address]);

    // Debounced search
    useEffect(() => {
        if (!searchQuery) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(() => {
            setIsSearching(true);
            searchUsers(searchQuery)
                .then(setSearchResults)
                .finally(() => setIsSearching(false));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        const payload = {
            receiver_address: selectedUser.stx_address,
            content: newMessage,
        };

        const tempMsg = {
            id: Date.now(),
            sender_address: address,
            receiver_address: selectedUser.stx_address,
            content: newMessage,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempMsg]);
        setNewMessage("");

        try {
            const savedMsg = await sendMessage(payload);
            setMessages(prev => prev.map(m => m.id === tempMsg.id ? savedMsg : m));

            setConversations(prev => {
                const others = prev.filter(c => c.sender_address !== selectedUser.stx_address && c.receiver_address !== selectedUser.stx_address);
                return [savedMsg, ...others];
            });
        } catch (err: any) {
            console.error(err);
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
            if (err.message && err.message.includes("403")) {
                alert("You are not friends with this user.");
            }
        }
    };

    // Connection helpers
    const getConnectionStatus = (otherAddress: string) => {
        const conn = connections.find(c => c.requester_address === otherAddress || c.recipient_address === otherAddress);
        if (!conn) return null;
        return {
            status: conn.status,
            isRequester: conn.requester_address === address,
            id: conn.id,
        };
    };

    const handleAddFriend = async (otherAddress: string) => {
        try {
            const res = await sendFriendRequest(otherAddress);
            setConnections(prev => [...prev, res.connection]);
        } catch (error) {
            console.error("Failed to send request", error);
        }
    };

    const handleAcceptFriend = async (connId: number) => {
        try {
            const res = await acceptFriendRequest(connId);
            setConnections(prev => prev.map(c => c.id === connId ? res.connection : c));
        } catch (error) {
            console.error("Failed to accept", error);
        }
    };

    const activeChatAddress = selectedUser?.stx_address;
    const currentConnection = selectedUser ? getConnectionStatus(selectedUser.stx_address) : null;
    const isFriend = currentConnection?.status === "accepted";

    const pendingRequests = connections.filter(c => c.status === "pending" && c.recipient_address === address);

    if (!isConnected) {
        return (
            <div className="pt-24 min-h-screen flex items-center justify-center">
                <Navigation />
                <p className="text-white/50 text-xl font-bold font-display uppercase tracking-wider">Connect wallet to view messages</p>
            </div>
        );
    }

    return (
        <div className="pt-16 min-h-screen bg-[#0a0a0c] flex">
            <Navigation />
            {/* Sidebar: Conversations & Search */}
            <div className="w-80 border-r border-[#2a2a30] flex flex-col bg-[#0f0f13]">
                <div className="p-4 border-b border-[#2a2a30]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-[#00ffff] font-display uppercase tracking-widest">Messages</h2>
                    </div>

                    <div className="flex bg-[#1a1a20] rounded-lg p-1 mb-4">
                        <button
                            onClick={() => setViewMode("chats")}
                            className={cn(
                                "flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
                                viewMode === "chats" ? "bg-[#a855f7] text-white" : "text-white/40 hover:text-white"
                            )}
                        >
                            Chats
                        </button>
                        <button
                            onClick={() => setViewMode("requests")}
                            className={cn(
                                "flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1.5",
                                viewMode === "requests" ? "bg-[#a855f7] text-white" : "text-white/40 hover:text-white"
                            )}
                        >
                            Requests
                            {pendingRequests.length > 0 && (
                                <span className="bg-[#ff2d95] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                                    {pendingRequests.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {viewMode === "chats" && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input
                                type="text"
                                placeholder="Search users by name / address..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-[#1a1a20] border border-[#2a2a30] focus:border-[#a855f7] rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition-all"
                            />
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {viewMode === "requests" ? (
                        <div className="p-2 space-y-2">
                            {pendingRequests.length === 0 ? (
                                <p className="p-2 text-sm text-white/40 text-center mt-4">No pending friend requests.</p>
                            ) : (
                                pendingRequests.map(req => (
                                    <div key={req.id} className="p-3 bg-[#1a1a20] rounded-lg border border-[#2a2a30]">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#a855f7] to-[#00ffff] flex items-center justify-center text-xs font-bold text-white shrink-0">
                                                {req.requester?.name ? req.requester.name[0].toUpperCase() : <User className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[#e0d4ff] truncate">{req.requester?.name || 'Unknown'}</p>
                                                <p className="text-xs text-[#a855f7] font-mono truncate">{req.requester_address}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAcceptFriend(req.id)}
                                                className="flex-1 py-1.5 bg-[#a855f7] hover:bg-[#8b5cf6] text-white text-xs font-bold rounded flex items-center justify-center gap-1 transition-colors"
                                            >
                                                <Check className="w-3.5 h-3.5" /> Accept
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : searchQuery ? (
                        <div className="p-2">
                            <p className="px-2 py-1 text-xs font-mono text-white/40 uppercase">Search Results</p>
                            {isSearching ? <p className="p-2 text-sm max-w-sm text-white/40">Searching...</p> : null}
                            {searchResults.map(user => {
                                const conn = getConnectionStatus(user.stx_address);
                                return (
                                    <div key={user.stx_address} className="w-full flex items-center gap-3 p-3 hover:bg-[#1a1a20] rounded-lg transition-colors border-b border-[#1a1a20] cursor-pointer group" onClick={() => { setSelectedUser(user); setSearchQuery(""); }}>
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#a855f7] to-[#00ffff] flex items-center justify-center text-xs font-bold text-white shrink-0">
                                            {user.name ? user.name[0].toUpperCase() : <User className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[#e0d4ff] truncate">{user.name || 'Unknown'}</p>
                                            <p className="text-xs text-[#a855f7] font-mono truncate">{user.stx_address}</p>
                                        </div>
                                        {/* Quick status badge if known */}
                                        {conn?.status === "accepted" && <Check className="w-3.5 h-3.5 text-[#00ffff]" />}
                                        {conn?.status === "pending" && <Clock className="w-3.5 h-3.5 text-white/40" />}
                                    </div>
                                );
                            })}
                            {!isSearching && searchResults.length === 0 && (
                                <p className="p-2 text-sm text-white/40">No users found</p>
                            )}
                        </div>
                    ) : (
                        <div className="p-2">
                            <p className="px-2 py-1 text-xs font-mono text-white/40 uppercase">Recent Chats</p>
                            {conversations.length === 0 && (
                                <p className="p-2 text-sm text-white/40 text-center mt-4 border border-dashed border-white/10 p-4 rounded-lg">Search for a user to start chatting.</p>
                            )}
                            {conversations.map(conv => {
                                const otherAddress = conv.sender_address === address ? conv.receiver_address : conv.sender_address;
                                const isSelected = activeChatAddress === otherAddress;
                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedUser({ stx_address: otherAddress, name: otherAddress.slice(0, 8) + '...' })}
                                        className={cn(
                                            "w-full flex items-start flex-col gap-1 p-3 rounded-lg transition-colors text-left mb-1 border border-transparent",
                                            isSelected ? "bg-[#1a1a20] border-[#a855f7]/30" : "hover:bg-[#1a1a20]/60"
                                        )}
                                    >
                                        <div className="w-full flex justify-between items-center">
                                            <p className="text-sm font-bold text-[#e0d4ff] font-mono truncate">{otherAddress.slice(0, 10)}...</p>
                                            <span className="text-[10px] text-white/40 font-mono">
                                                {new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-white/50 truncate w-full">{conv.content}</p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-[#0a0a0c]">
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 border-b border-[#2a2a30] px-6 flex items-center justify-between bg-[#0f0f13]">
                            <div className="flex flex-col">
                                <h3 className="text-sm font-bold text-[#e0d4ff] flex items-center gap-2">
                                    {selectedUser.name || 'User'}
                                    {isFriend && <span className="bg-[#00ffff]/10 text-[#00ffff] px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider border border-[#00ffff]/20">Friend</span>}
                                </h3>
                                <span className="text-xs text-[#a855f7] font-mono">{selectedUser.stx_address}</span>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {!currentConnection && selectedUser.stx_address !== address && (
                                <div className="bg-[#1a1a20] border border-[#2a2a30] rounded-xl p-6 text-center max-w-sm mx-auto mt-10">
                                    <UserPlus className="w-10 h-10 text-[#a855f7] mx-auto mb-3" />
                                    <h3 className="text-white font-bold mb-1">Not Connected</h3>
                                    <p className="text-white/50 text-sm mb-4">You need to add this user as a friend before you can send messages.</p>
                                    <button
                                        onClick={() => handleAddFriend(selectedUser.stx_address)}
                                        className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#00ffff] transition-colors"
                                    >
                                        Send Friend Request
                                    </button>
                                </div>
                            )}

                            {currentConnection?.status === "pending" && selectedUser.stx_address !== address && (
                                <div className="bg-[#1a1a20] border border-[#2a2a30] rounded-xl p-6 text-center max-w-sm mx-auto mt-10">
                                    <Clock className="w-10 h-10 text-[#00ffff] mx-auto mb-3" />
                                    <h3 className="text-white font-bold mb-1">Request Pending</h3>
                                    <p className="text-white/50 text-sm">
                                        {currentConnection.isRequester
                                            ? "Waiting for them to accept your friend request."
                                            : "They sent you a friend request. Accept it from the Requests tab to start chatting."}
                                    </p>
                                </div>
                            )}

                            {(isFriend || selectedUser.stx_address === address) && (
                                <>
                                    {messages.map((m) => {
                                        const isMe = m.sender_address === address;
                                        return (
                                            <div key={m.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                                                <div className={cn(
                                                    "max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-md",
                                                    isMe
                                                        ? "bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white rounded-br-none"
                                                        : "bg-[#1a1a20] text-[#e0d4ff] border border-[#2a2a30] rounded-bl-none"
                                                )}>
                                                    {m.content}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {messages.length === 0 && (
                                        <div className="w-full h-full flex items-center justify-center text-white/30 text-sm font-mono mt-20">
                                            Start the conversation with {selectedUser.stx_address.slice(0, 8)}...
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Input Area */}
                        {(isFriend || selectedUser.stx_address === address) && (
                            <div className="p-4 border-t border-[#2a2a30] bg-[#0f0f13]">
                                <form onSubmit={handleSend} className="relative flex items-center">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="w-full bg-[#1a1a20] border border-[#2a2a30] rounded-full py-3 pl-5 pr-12 text-sm text-white placeholder:text-white/30 focus:border-[#00ffff] focus:ring-1 focus:ring-[#00ffff]/50 outline-none transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="absolute right-2 p-2 bg-[#00ffff] text-black rounded-full hover:bg-white disabled:opacity-50 transition-colors"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-[#1a1a20] border border-[#2a2a30] flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 text-[#a855f7]" />
                        </div>
                        <p className="text-white/40 font-mono text-sm">Select a conversation or search for a user to start chatting.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
