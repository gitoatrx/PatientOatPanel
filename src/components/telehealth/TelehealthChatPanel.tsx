"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";

export interface TelehealthChatMessage {
  id: string;
  author: string;
  authoredAt: string;
  content: string;
  isOwn?: boolean;
}

interface TelehealthChatPanelProps {
  participantName: string;
  participantStatus?: "online" | "offline" | "busy";
  participantRole?: string;
  messages: TelehealthChatMessage[];
  onClose?: () => void;
}


const brandBubbleClass = "bg-blue-500 text-white rounded-2xl rounded-br-md";
const neutralBubbleClass = "bg-gray-200 text-gray-900 rounded-2xl rounded-bl-md";

export function TelehealthChatPanel({
  messages,
}: TelehealthChatPanelProps) {
  const [draftMessage, setDraftMessage] = useState("");
  const [chatMessages, setChatMessages] = useState(() => messages);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const anchor = bottomAnchorRef.current;
    if (!anchor) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    anchor.scrollIntoView({ behavior: chatMessages.length > messages.length && !prefersReducedMotion ? "smooth" : "auto", block: "end" });
  }, [chatMessages.length, messages.length]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draftMessage.trim();
    if (!trimmed) return;

    const nextMessage: TelehealthChatMessage = {
      id: Math.random().toString(36).slice(2),
      author: "You",
      authoredAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      content: trimmed,
      isOwn: true,
    };

    setChatMessages((prev) => [...prev, nextMessage]);
    setDraftMessage("");
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-hidden p-2 sm:p-4">
        <div ref={scrollContainerRef} className="h-full overflow-y-auto space-y-2 sm:space-y-3">
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex flex-col gap-1",
                message.isOwn ? "items-end" : "items-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] sm:max-w-[80%] px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg break-words overflow-wrap-anywhere",
                  message.isOwn ? brandBubbleClass : neutralBubbleClass,
                )}
              >
                <p className="break-words overflow-wrap-anywhere">{message.content}</p>
              </div>
              <div className="text-xs text-gray-500 px-1">
                {message.authoredAt}
              </div>
            </div>
          ))}
          <div ref={bottomAnchorRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t border-border p-2 sm:p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex items-center gap-1 sm:gap-2">
          <div className="flex-1 relative">
            <div className="flex items-center bg-white rounded-lg border border-gray-300">
              {/* Text Input */}
              <Textarea
                value={draftMessage}
                onChange={(event) => {
                  setDraftMessage(event.target.value);
                  // Auto-resize textarea
                  const textarea = event.target;
                  textarea.style.height = 'auto';
                  textarea.style.height = Math.min(textarea.scrollHeight, 80) + 'px'; // Max 2 rows (40px per row)
                }}
                placeholder="Write your message..."
                className="flex-1 min-h-[36px] sm:min-h-[40px] max-h-[80px] resize-none bg-transparent border-0 text-gray-900 placeholder-gray-500 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm focus:ring-0 focus:outline-none overflow-hidden"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    // Create a synthetic form event for handleSubmit
                    const formEvent = new Event('submit', { bubbles: true, cancelable: true }) as unknown as React.FormEvent<HTMLFormElement>;
                    handleSubmit(formEvent);
                  }
                }}
              />
              
              {/* Send Button */}
              <Button 
                type="submit" 
                className="m-1.5 sm:m-2 h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary p-0 text-primary-foreground hover:bg-primary/90 flex-shrink-0"
              >
                <Send className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
