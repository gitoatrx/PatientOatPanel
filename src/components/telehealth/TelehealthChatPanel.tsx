"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Send, Paperclip, Image, File, X, Download } from "lucide-react";

// Discord-style Avatar component
function ChatAvatar({
  name,
  isOwn = false,
  size = "md"
}: {
  name: string;
  isOwn?: boolean;
  size?: "sm" | "md" | "lg"
}) {
  const getInitials = (rawName: string) => {
    const safe = (rawName ?? "").toString().trim() || "User";
    return safe
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm", 
    lg: "w-12 h-12 text-base"
  };

  const avatarColors = [
    "bg-red-500",
    "bg-orange-500", 
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500"
  ];

  const safeName = (name ?? "").toString().trim() || "User";
  // Generate consistent color based on name
  const colorIndex = safeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatarColors.length;
  const bgColor = avatarColors[colorIndex];

  return (
    <div className={cn(
      "rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm",
      sizeClasses[size],
      isOwn ? "bg-blue-500" : bgColor
    )}>
      {getInitials(safeName)}
    </div>
  );
}

export interface TelehealthChatMessage {
  id: string;
  author: string;
  authoredAt: string;
  content: string;
  isOwn?: boolean;
  type?: 'text' | 'image' | 'file';
  attachment?: {
    name: string;
    size: number;
    url?: string;
  };
}

interface TelehealthChatPanelProps {
  participantName: string;
  participantStatus?: "online" | "offline" | "busy";
  participantRole?: string;
  messages: TelehealthChatMessage[];
  onSendMessage?: (content: string, type?: 'text' | 'image' | 'file', attachment?: File | Blob) => void;
  onClose?: () => void;
  isConnected?: boolean;
  typingUsers?: Array<{ id: string; name: string; timestamp: number }>;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  // Drawer-style popup variant for mobile
  variant?: 'default' | 'drawer';
  headerTitle?: string;
  headerSubtitle?: string;
  participantNames?: string[];
}


const brandBubbleClass = "bg-blue-500 text-white rounded-2xl rounded-br-md";
const neutralBubbleClass = "bg-gray-200 text-gray-900 rounded-2xl rounded-bl-md";

export function TelehealthChatPanel({
  messages,
  onSendMessage,
  isConnected = true,
  typingUsers = [],
  onTypingStart,
  onTypingStop,
  variant = 'default',
  headerTitle = 'Meeting Chat',
  headerSubtitle,
  participantNames = [],
  onClose,
}: TelehealthChatPanelProps) {
  const [draftMessage, setDraftMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape when used as drawer
  useEffect(() => {
    if (variant !== 'drawer') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [variant, onClose]);

  useEffect(() => {
    const anchor = bottomAnchorRef.current;
    if (!anchor) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    anchor.scrollIntoView({ behavior: messages.length > 0 && !prefersReducedMotion ? "smooth" : "auto", block: "end" });
  }, [messages.length]);

  // Debug typing users
  useEffect(() => {
    console.log('👥 Typing users changed:', typingUsers);
  }, [typingUsers]);

  // Handle typing indicators
  const handleTyping = () => {
    if (!onTypingStart) {
      console.log('❌ No onTypingStart function provided');
      return;
    }
    
    console.log('⌨️ Typing started');
    onTypingStart();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      console.log('⌨️ Typing stopped');
      onTypingStop?.();
    }, 1000);
  };

  // Handle file attachments
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    console.log('📁 Files selected:', files.map(f => ({
      name: f.name,
      type: f.type,
      size: f.size
    })));
    
    if (files.length > 0) {
      // Check file size limit (estimate final size after base64 encoding)
      // Base64 increases size by ~33%, and we need to account for JSON overhead
      // So we limit original files to ~5KB to stay under 8KB total message size
      const maxOriginalSize = 5 * 1024; // 5KB original file size
      const validFiles = files.filter(file => {
        if (file.size > maxOriginalSize) {
          console.warn(`⚠️ File ${file.name} is too large (${formatFileSize(file.size)}). Maximum size is 5KB for chat compatibility.`);
          // Show user-friendly error
          alert(`File "${file.name}" is too large (${formatFileSize(file.size)}). Maximum size is 5KB for chat compatibility.`);
          return false;
        }
        return true;
      });
      
      if (validFiles.length > 0) {
        setAttachments(prev => [...prev, ...validFiles]);
        setShowAttachmentMenu(false);
      }
      
      // Clear the input so the same file can be selected again
      event.target.value = '';
    }
  };

  // Convert file to base64 for preview with compression for images
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type.startsWith('image/')) {
        // Compress images to reduce size
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new window.Image();
        
        img.onload = () => {
          // Calculate new dimensions (max 400px width/height for chat compatibility)
          const maxSize = 400;
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress with lower quality for smaller file size
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.5); // 50% quality for smaller size
          
          console.log('✅ Image compressed:', {
            name: file.name,
            originalSize: file.size,
            compressedSize: new Blob([compressedDataUrl]).size,
            dimensions: `${width}x${height}`
          });
          
          resolve(compressedDataUrl);
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      } else {
        // For non-images, use regular FileReader
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          console.log('✅ File converted to base64:', {
            name: file.name,
            size: file.size,
            base64Length: result.length
          });
          resolve(result);
        };
        reader.onerror = error => {
          console.error('❌ Failed to convert file to base64:', error);
          reject(error);
        };
      }
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draftMessage.trim();
    
    console.log('🔴 Chat form submitted:', {
      message: trimmed,
      attachments: attachments.length,
      hasOnSendMessage: !!onSendMessage,
      messageLength: trimmed.length
    });
    
    if (!trimmed && attachments.length === 0) {
      console.log('❌ No message content or attachments to send');
      return;
    }
    
    if (!onSendMessage) {
      console.log('❌ No onSendMessage function provided');
      return;
    }

    if (!isConnected) {
      console.log('❌ Cannot send message: not connected');
      return;
    }

    // Text-only messages
    onSendMessage(trimmed);

    setDraftMessage("");
    onTypingStop?.();
  };

  const isDrawer = variant === 'drawer';

  return (
    <div className={cn("flex h-full min-h-0 flex-col", isDrawer ? "bg-slate-900 text-white rounded-t-2xl" : "bg-gray-50")}>
      {/* Drawer Header */}
      {isDrawer && (
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800">
          <div className="flex flex-col gap-2 px-4 pt-2 pb-3">
            <div className="mx-auto h-1 w-12 rounded-full bg-white/20" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-base">{headerTitle}</h3>
                {headerSubtitle && <p className="text-emerald-400 text-xs">{headerSubtitle}</p>}
              </div>
              <div className="flex items-center gap-2">
                {participantNames.length > 0 && (
                  <div className="flex -space-x-2">
                    {participantNames.slice(0,5).map((n, i) => (
                      <div key={i} className="ring-2 ring-slate-900 rounded-full">
                        <ChatAvatar name={n || "Participant"} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onClose?.()}
                  aria-label="Close chat"
                  className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div ref={scrollContainerRef} className="h-full overflow-y-auto overscroll-contain scrollbar-hide p-3 sm:p-4">
          {messages.map((message, index) => {
            const isFirstMessage = index === 0;
            const isNewAuthor = index === 0 || messages[index - 1].author !== message.author;
            const isLastMessage = index === messages.length - 1;
            const isNextMessageSameAuthor = index < messages.length - 1 && messages[index + 1].author === message.author;
            
            return (
              <div
                key={message.id}
                className={cn(
                  "group relative flex gap-3 px-3 sm:px-4 py-1.5 transition-colors",
                  isDrawer ? "hover:bg-white/5" : "hover:bg-gray-50/50",
                  isNewAuthor && "mt-3",
                  !isNewAuthor && "mt-0.5",
                  message.isOwn ? "flex-row-reverse text-right items-end" : "items-end"
                )}
              >
                {/* Avatar - only show for first message from each author */}
                <div className="flex-shrink-0">
                  {isNewAuthor ? (
                    <ChatAvatar
                      name={message.isOwn ? "You" : (message.author || "Participant")}
                      isOwn={message.isOwn}
                      size="md"
                    />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center">
                      <div className={cn("w-0.5 h-6 rounded-full", isDrawer ? "bg-slate-600" : "bg-gray-300")}></div>
                    </div>
                  )}
                </div>
                
                {/* Message content */}
                <div className="flex-1 min-w-0">
                  {/* Author name and timestamp - only show for first message from each author */}
                  {isNewAuthor && (
                    <div className={cn("flex items-baseline gap-2 mb-1", message.isOwn && "justify-end")}>
                      <span className={cn(
                        "font-semibold text-sm",
                        isDrawer ? "text-white" : message.isOwn ? "text-blue-600" : "text-gray-900"
                      )}>
                        {message.isOwn ? "You" : (message.author || "Participant")}
                      </span>
                      <span className={cn("text-xs font-medium", isDrawer ? "text-slate-400" : "text-gray-500")}>
                        {message.authoredAt}
                      </span>
                    </div>
                  )}

                  {/* Message content */}
                  <div className="relative">
                    <div
                      className={cn(
                        "inline-block max-w-[80%] px-3 py-2 rounded-2xl text-sm break-words leading-relaxed",
                        isDrawer
                          ? message.isOwn
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-700 text-white"
                          : message.isOwn
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-900"
                      )}
                    >
                  {/* Attachment display */}
                  {message.attachment && (
                    <div className={message.type === 'image' && !message.content ? "p-1" : "mb-2 p-2 bg-white/10 rounded-lg"}>
                      {message.type === 'image' && message.attachment.url ? (
                        // Image preview
                        <div className="space-y-2">
                          <img 
                            src={message.attachment.url} 
                            alt={message.attachment.name}
                            className="max-w-full max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              // Open image in new tab for full view
                              const newWindow = window.open();
                              if (newWindow && message.attachment) {
                                newWindow.document.write(`
                                  <html>
                                    <head><title>${message.attachment.name}</title></head>
                                    <body style="margin:0;padding:20px;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;">
                                      <img src="${message.attachment.url}" style="max-width:100%;max-height:100%;object-fit:contain;" alt="${message.attachment.name}" />
                                    </body>
                                  </html>
                                `);
                              }
                            }}
                          />
                          {message.content && (
                            <div className="flex items-center gap-2 text-xs">
                              <Image className="h-3 w-3" />
                              <span className="font-medium">{message.attachment.name}</span>
                              <span className="opacity-75">
                                {formatFileSize(message.attachment.size)}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        // File display
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4" />
                          <span className="text-xs font-medium">{message.attachment.name}</span>
                          <span className="text-xs opacity-75">
                            {formatFileSize(message.attachment.size)}
                          </span>
                          {message.attachment.url && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                // Download file
                                if (message.attachment?.url) {
                                  try {
                                    const link = document.createElement('a');
                                    link.href = message.attachment.url;
                                    link.download = message.attachment.name;
                                    link.style.display = 'none';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    console.log('📥 File download initiated:', message.attachment.name);
                                  } catch (error) {
                                    console.error('Download failed:', error);
                                    // Fallback: open in new tab
                                    window.open(message.attachment.url, '_blank');
                                  }
                                }
                              }}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                      {/* Message text */}
                      {message.content && (
                        <p className="break-words overflow-wrap-anywhere">{message.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Typing indicators */}
          {typingUsers.length > 0 && (() => {
            console.log('👀 Showing typing indicator for:', typingUsers.map(u => u.name));
            return (
              <div className={cn("flex gap-3 px-4 py-2 border-l-2", isDrawer ? "bg-slate-800/60 border-emerald-400/50" : "bg-gray-50/50 border-blue-200")}>
              {/* Avatar for typing user */}
              <div className="flex-shrink-0">
                <ChatAvatar 
                  name={typingUsers[0].name || "Participant"} 
                  isOwn={false} 
                  size="md" 
                />
              </div>
              
              {/* Typing indicator */}
              <div className="flex items-center gap-3">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className={cn("text-sm font-medium animate-pulse", isDrawer ? "text-slate-300" : "text-gray-600")}>
                  {typingUsers.map(user => user.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            </div>
            );
          })()}
          
          <div ref={bottomAnchorRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className={cn("p-3", isDrawer ? "border-t border-slate-800 bg-slate-900" : "border-t border-gray-300 bg-gray-100")}>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <div className={cn("flex items-center rounded-full border shadow-sm pl-3", isDrawer ? "bg-slate-800 border-slate-700" : "bg-white border-gray-300")}>
              {/* Text Input */}
              <Textarea
                value={draftMessage}
                onChange={(event) => {
                  setDraftMessage(event.target.value);
                  handleTyping();
                  const textarea = event.target;
                  textarea.style.height = 'auto';
                  textarea.style.height = Math.min(textarea.scrollHeight, 80) + 'px';
                }}
                placeholder="Type something here"
                className={cn("flex-1 min-h-[40px] sm:min-h-[44px] max-h-[80px] resize-none bg-transparent border-0 px-2 py-2 sm:px-4 sm:py-3 text-sm focus:ring-0 focus:outline-none overflow-hidden", isDrawer ? "text-white placeholder-slate-400" : "text-gray-900 placeholder-gray-500")}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const formEvent = new Event('submit', { bubbles: true, cancelable: true }) as unknown as React.FormEvent<HTMLFormElement>;
                    handleSubmit(formEvent);
                  }
                }}
              />
              
              {/* Send Button */}
              <Button
                type="submit"
                disabled={!draftMessage.trim()}
                className={cn("my-1 mr-1 h-9 w-9 p-0 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", isDrawer ? "rounded-full bg-emerald-500 text-white hover:bg-emerald-600" : "rounded-full bg-blue-500 text-white hover:bg-blue-600")}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
