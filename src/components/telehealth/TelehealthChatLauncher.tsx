"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageCircle, X } from "lucide-react";
import { TelehealthChatPanel, type TelehealthChatMessage } from "./TelehealthChatPanel";

interface TelehealthChatLauncherProps {
  messages: TelehealthChatMessage[];
  participantName: string;
  participantRole?: string;
  participantStatus?: "online" | "offline" | "busy";
}

export function TelehealthChatLauncher({
  messages,
  participantName,
  participantRole = "Doctor",
  participantStatus = "online",
}: TelehealthChatLauncherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const toggleChat = () => {
    setIsOpen((prev) => {
      if (!prev) {
        // Opening chat, mark messages as read
        setHasUnreadMessages(false);
      }
      return !prev;
    });
  };

  // Check for unread messages (messages from others when chat is closed)
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && !lastMessage.isOwn) {
        setHasUnreadMessages(true);
      }
    }
  }, [messages, isOpen]);

  return (
    <>
      <Button
        type="button"
        size="icon"
        className={cn(
          "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-[#1B58F5] text-white shadow-xl transition-all duration-200 hover:scale-105",
          isOpen && "bg-red-500 hover:bg-red-600",
        )}
        onClick={toggleChat}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        
        {/* Unread message indicator */}
        {hasUnreadMessages && !isOpen && (
          <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
          </div>
        )}
      </Button>

      {isOpen ? (
        <div className="fixed bottom-24 right-6 z-40 w-[420px] max-w-[calc(100vw-3rem)] animate-in slide-in-from-bottom-2 duration-200">
          <TelehealthChatPanel
            participantName={participantName}
            participantRole={participantRole}
            participantStatus={participantStatus}
            messages={messages}
            onClose={toggleChat}
          />
        </div>
      ) : null}
    </>
  );
}
