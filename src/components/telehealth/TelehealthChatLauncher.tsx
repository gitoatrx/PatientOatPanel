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
  onSendMessage?: (content: string) => void;
  // Controlled mode
  isOpen?: boolean;
  onToggle?: () => void;
  hideTrigger?: boolean;
  // Drawer UI props passthrough
  variant?: 'default' | 'drawer';
  headerTitle?: string;
  headerSubtitle?: string;
  participantNames?: string[];
}

export function TelehealthChatLauncher({
  messages,
  participantName,
  participantRole = "Doctor",
  participantStatus = "online",
  onSendMessage,
  isOpen: isOpenProp,
  onToggle,
  hideTrigger = false,
  variant = 'default',
  headerTitle,
  headerSubtitle,
  participantNames = [],
}: TelehealthChatLauncherProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isOpenProp ?? internalOpen;
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const toggleChat = () => {
    if (onToggle) {
      onToggle();
      if (!isOpen) setHasUnreadMessages(false);
      return;
    }
    setInternalOpen((prev) => {
      if (!prev) {
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
      {isOpen && (
        <div
          className={cn("fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity", variant === 'drawer' ? "block" : "hidden")}
          onClick={toggleChat}
          aria-label="Close chat"
        />
      )}

      {!hideTrigger && (
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
          {hasUnreadMessages && !isOpen && (
            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
            </div>
          )}
        </Button>
      )}

      {isOpen ? (
        <div
          className="fixed inset-x-0 bottom-0 z-40 w-full sm:bottom-24 sm:right-6 sm:inset-x-auto sm:w-[420px] sm:max-w-[calc(100vw-3rem)] h-[70svh] max-h-[70svh] rounded-t-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-2 duration-200"
          role="dialog"
          aria-modal="true"
        >
          <TelehealthChatPanel
            participantName={participantName}
            participantRole={participantRole}
            participantStatus={participantStatus}
            messages={messages}
            onSendMessage={onSendMessage}
            onClose={toggleChat}
            variant={variant}
            headerTitle={headerTitle}
            headerSubtitle={headerSubtitle}
            participantNames={participantNames}
          />
        </div>
      ) : null}
    </>
  );
}
