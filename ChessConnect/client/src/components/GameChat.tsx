import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";

interface ChatMessage {
  _id?: string;
  id?: string;
  gameId: string;
  playerId: string;
  message: string;
  createdAt: string;
  player?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
}

interface GameChatProps {
  gameId: string;
}

export default function GameChat({ gameId }: GameChatProps) {
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat", gameId],
    queryFn: async () => {
      const response = await fetch(`/api/games/${gameId}/chat`);
      if (!response.ok) throw new Error("Failed to fetch chat messages");
      return response.json();
    },
    refetchInterval: 2000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await fetch(`/api/games/${gameId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["chat", gameId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && user) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-64">
      <div className="mb-2">
        <h3 className="font-semibold text-sm">Game Chat</h3>
      </div>

      <ScrollArea className="flex-1 border rounded p-2 mb-2" ref={scrollAreaRef}>
        <div className="space-y-2">
          {!messages || messages.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-gray-500">No messages yet</p>
              <p className="text-xs text-gray-400">Send a message to start chatting!</p>
            </div>
          ) : (
            messages.map((msg: ChatMessage, index: number) => (
              <div key={msg._id || msg.id || `msg-${index}`} className="text-sm">
                <div className="flex items-start space-x-2">
                  <span className="text-xs text-gray-500 font-medium min-w-0">
                    {msg?.playerId === user?.id ? 'You' : 'Opponent'}:
                  </span>
                  <span className="text-gray-700 break-words flex-1">
                    {msg?.message || ''}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 text-sm"
          disabled={!user}
        />
        <Button 
          type="submit" 
          size="sm"
          disabled={!message.trim() || !user || sendMessageMutation.isPending}
        >
          Send
        </Button>
      </form>
    </div>
  );
}