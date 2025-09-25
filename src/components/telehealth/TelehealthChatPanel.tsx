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
  const getInitials = (name: string) => {
    return name
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

  // Generate consistent color based on name
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatarColors.length;
  const bgColor = avatarColors[colorIndex];

  return (
    <div className={cn(
      "rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm",
      sizeClasses[size],
      isOwn ? "bg-blue-500" : bgColor
    )}>
      {getInitials(name)}
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
  onSendMessage?: (content: string, type?: 'text' | 'image' | 'file', attachment?: any) => void;
  onClose?: () => void;
  isConnected?: boolean;
  typingUsers?: Array<{ id: string; name: string; timestamp: number }>;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
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
}: TelehealthChatPanelProps) {
  const [draftMessage, setDraftMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);

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

    // Send message with attachments
    if (attachments.length > 0) {
      for (const file of attachments) {
        try {
          // Convert ALL files to base64 for sharing/downloading
          const base64Data = await fileToBase64(file);
          
          // Check the actual message size that will be sent
          const testMessage = {
            author: "test",
            content: trimmed || `Sent ${file.name}`,
            type: file.type.startsWith('image/') ? 'image' : 'file',
            attachment: {
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              url: base64Data
            },
            timestamp: Date.now()
          };
          
          const testMessageSize = new Blob([JSON.stringify(testMessage)]).size;
          console.log('📊 Message size check:', {
            fileName: file.name,
            originalSize: file.size,
            base64Size: new Blob([base64Data]).size,
            totalMessageSize: testMessageSize,
            sizeKB: Math.round(testMessageSize / 1024)
          });
          
          // Vonage Video signaling limit is ~8KB
          if (testMessageSize > 8000) {
            console.warn(`⚠️ Message too large for Vonage Video signaling: ${Math.round(testMessageSize / 1024)}KB`);
            alert(`File "${file.name}" is too large to send via chat. The file becomes ${Math.round(testMessageSize / 1024)}KB when encoded, which exceeds the chat limit. Please use a smaller file.`);
            continue; // Skip this file and try the next one
          }
          
          const attachmentData: any = {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            url: base64Data // Always include base64 data for download
          };
          
          const messageType = file.type.startsWith('image/') ? 'image' : 'file';
          // For images, don't show "Sent filename" text - just show the image
          // For files, show the filename as text
          const content = file.type.startsWith('image/') 
            ? (trimmed || '') // Empty or custom message for images
            : (trimmed || `Sent ${file.name}`); // Show filename for files
          
          console.log('📤 Sending file attachment:', {
            name: file.name,
            type: file.type,
            size: file.size,
            hasBase64: !!base64Data
          });
          
          onSendMessage(content, messageType, attachmentData);
        } catch (error) {
          console.error('Error processing file:', error);
          // Send without base64 if conversion fails
          const attachmentData = {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
          };
          const messageType = file.type.startsWith('image/') ? 'image' : 'file';
          const content = file.type.startsWith('image/') 
            ? (trimmed || '') // Empty or custom message for images
            : (trimmed || `Sent ${file.name}`); // Show filename for files
          onSendMessage(content, messageType, attachmentData);
        }
      }
    } else {
      onSendMessage(trimmed);
    }
    
    setDraftMessage("");
    setAttachments([]);
    onTypingStop?.();
  };

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div ref={scrollContainerRef} className="h-full overflow-y-auto">
          {messages.map((message, index) => {
            const isFirstMessage = index === 0;
            const isNewAuthor = index === 0 || messages[index - 1].author !== message.author;
            const isLastMessage = index === messages.length - 1;
            const isNextMessageSameAuthor = index < messages.length - 1 && messages[index + 1].author === message.author;
            
            return (
              <div
                key={message.id}
                className={cn(
                  "group relative flex gap-3 px-4 py-1 hover:bg-gray-50/50 transition-colors",
                  isNewAuthor && "mt-4",
                  !isNewAuthor && "mt-0.5"
                )}
              >
                {/* Avatar - only show for first message from each author */}
                <div className="flex-shrink-0">
                  {isNewAuthor ? (
                    <ChatAvatar 
                      name={message.isOwn ? "You" : message.author} 
                      isOwn={message.isOwn} 
                      size="md" 
                    />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center">
                      <div className="w-0.5 h-6 bg-gray-300 rounded-full"></div>
                    </div>
                  )}
                </div>
                
                {/* Message content */}
                <div className="flex-1 min-w-0">
                  {/* Author name and timestamp - only show for first message from each author */}
                  {isNewAuthor && (
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={cn(
                        "font-semibold text-sm",
                        message.isOwn ? "text-blue-600" : "text-gray-900"
                      )}>
                        {message.isOwn ? "You" : message.author}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {message.authoredAt}
                      </span>
                    </div>
                  )}
                  
                  {/* Message content */}
                  <div className="relative">
                    <div
                      className={cn(
                        "text-sm break-words overflow-wrap-anywhere leading-relaxed",
                        message.isOwn ? "text-blue-900" : "text-gray-900"
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
              <div className="flex gap-3 px-4 py-2 bg-gray-50/50 border-l-2 border-blue-200">
              {/* Avatar for typing user */}
              <div className="flex-shrink-0">
                <ChatAvatar 
                  name={typingUsers[0].name} 
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
                <span className="text-sm text-gray-600 font-medium animate-pulse">
                  {typingUsers.map(user => user.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            </div>
            );
          })()}
          
          <div ref={bottomAnchorRef} />
        </div>
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="border-t border-gray-300 p-3 bg-gray-100">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-300 shadow-sm">
                {file.type.startsWith('image/') ? (
                  <div className="flex items-center gap-2">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={file.name}
                      className="h-8 w-8 rounded object-cover"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium truncate max-w-[100px]">{file.name}</span>
                      <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <File className="h-4 w-4 text-gray-500" />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium truncate max-w-[100px]">{file.name}</span>
                      <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                    </div>
                  </>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 ml-auto hover:bg-gray-100"
                  onClick={() => removeAttachment(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t border-gray-300 p-3 bg-gray-100">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <div className="flex items-center bg-white rounded-lg border border-gray-300 shadow-sm">
              {/* Attachment Button */}
              <div className="relative">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                {/* Attachment Menu */}
                {showAttachmentMenu && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="justify-start text-left"
                        onClick={() => {
                          imageInputRef.current?.click();
                          setShowAttachmentMenu(false);
                        }}
                      >
                        <Image className="h-4 w-4 mr-2" />
                        Image
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="justify-start text-left"
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowAttachmentMenu(false);
                        }}
                      >
                        <File className="h-4 w-4 mr-2" />
                        File
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Text Input */}
              <Textarea
                value={draftMessage}
                onChange={(event) => {
                  setDraftMessage(event.target.value);
                  handleTyping();
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
                disabled={!draftMessage.trim() && attachments.length === 0}
                className="m-1 h-8 w-8 rounded-lg bg-blue-500 p-0 text-white hover:bg-blue-600 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
        
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="*/*"
        />
        <input
          ref={imageInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*"
        />
      </div>
    </div>
  );
}
