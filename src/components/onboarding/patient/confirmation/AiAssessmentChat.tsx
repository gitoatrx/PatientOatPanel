"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Mic, MicOff, Send, Loader2, User } from "lucide-react";
import { BimbleLogoIcon } from "@/components/icons";

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  audioUrl?: string;
  isStreaming?: boolean;
  structuredData?: {
    findings?: string[];
    differentials?: Array<{ condition: string; likelihood: string }>;
    followup?: string[];
    confidence?: number;
    disclaimer?: string;
  };
}

interface AiAssessmentChatProps {
  isOpen: boolean;
  onClose: () => void;
  isEmbedded?: boolean;
}

export function AiAssessmentChat({
  isOpen,
  onClose,
  isEmbedded = false,
}: AiAssessmentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "ai",
      content:
        "Hi! 👋 I'm your clinical assistant. Your appointment with Dr. Sarah Johnson is confirmed for September 15, 2025 at 2:30 PM at Downtown Medical Center.",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-start assessment conversation
  useEffect(() => {
    if (isOpen && messages.length === 1) {
      const timer = setTimeout(() => {
        setIsTyping(true);
        const typingTimer = setTimeout(() => {
          const assessmentPrompt: ChatMessage = {
            id: `assessment-${Date.now()}`,
            type: "ai",
            content: "To help your doctor provide the best care, let's complete a quick pre-visit assessment. This will only take about 2 minutes. Would you like to start?",
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assessmentPrompt]);
          setIsTyping(false);
        }, 1000);
        
        return () => clearTimeout(typingTimer);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages.length]);

  // WebSocket connection
  useEffect(() => {
    if (isOpen) {
      setIsConnecting(true);
      // Simulate WebSocket connection - replace with actual WebSocket URL
      const ws = new WebSocket("ws://localhost:3001/ai-assessment");

      ws.onopen = () => {
        setIsConnecting(false);
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        setIsConnecting(false);
        console.log("WebSocket disconnected");
      };

      ws.onerror = (error) => {
        setIsConnecting(false);
        console.error("WebSocket error:", error);
      };

      wsRef.current = ws;

      return () => {
        ws.close();
      };
    }
  }, [isOpen]);

  const handleWebSocketMessage = (data: {
    type: string;
    data: {
      content: string;
      findings?: string[];
      differentials?: Array<{ condition: string; likelihood: string }>;
      followup?: string[];
      confidence?: number;
      disclaimer?: string;
    };
  }) => {
    switch (data.type) {
      case "answer.text":
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.type === "ai" && lastMessage.isStreaming) {
            // Update existing streaming message
            return prev.map((msg) =>
              msg.id === lastMessage.id
                ? {
                    ...msg,
                    content: data.data.content,
                    structuredData: {
                      findings: data.data.findings,
                      differentials: data.data.differentials,
                      followup: data.data.followup,
                      confidence: data.data.confidence,
                      disclaimer: data.data.disclaimer,
                    },
                    isStreaming: false,
                  }
                : msg,
            );
          } else {
            // Create new AI message
            return [
              ...prev,
              {
                id: Date.now().toString(),
                type: "ai" as const,
                content: data.data.content ?? "AI response received",
                timestamp: new Date(),
                structuredData: {
                  findings: data.data.findings,
                  differentials: data.data.differentials,
                  followup: data.data.followup,
                  confidence: data.data.confidence,
                  disclaimer: data.data.disclaimer,
                },
                isStreaming: false,
              },
            ];
          }
        });
        break;

      case "audio.chunk":
        // Handle audio chunk - in real implementation, you'd buffer these
        console.log("Audio chunk received");
        break;

      case "audio.end":
        // Handle audio stream end
        console.log("Audio stream ended");
        break;

      default:
        console.log("Unknown message type:", data.type);
    }
  };

  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    const timestamp = Date.now();
    const userMessage: ChatMessage = {
      id: `user-${timestamp}`,
      type: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Create streaming AI message
    const aiMessage: ChatMessage = {
      id: `ai-${timestamp + 1}`,
      type: "ai",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, aiMessage]);

    // Send to WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "user.message",
          data: { content: content.trim() },
        }),
      );
    } else {
      // Simulate AI response for demo
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessage.id
              ? {
                  ...msg,
                  content:
                    "Thank you for your question. I'm analyzing your appointment details and will provide you with relevant information shortly.",
                  isStreaming: false,
                  structuredData: {
                    findings: ["Appointment scheduled for September 15, 2025"],
                    differentials: [
                      {
                        condition: "General Consultation",
                        likelihood: "confirmed",
                      },
                    ],
                    followup: ["Arrive 15 minutes early", "Bring valid ID"],
                    confidence: 0.95,
                    disclaimer:
                      "This is a demo response. In production, this would be generated by MedGemma AI.",
                  },
                }
              : msg,
          ),
        );
      }, 2000);
    }

    setInputText("");
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        // In real implementation, send audio to backend for ASR
        console.log("Audio recorded:", audioUrl);

        // Simulate speech-to-text
        setTimeout(() => {
          sendMessage("This is a simulated voice message transcription");
        }, 1000);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  if (!isOpen) return null;

  if (isEmbedded) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              Clinical Assistant
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors flex-shrink-0"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
          {messages.map((message) => (
            <ChatMessageComponent key={message.id} message={message} />
          ))}
          {isConnecting && (
            <div className="flex items-center gap-2 text-gray-500 px-3 sm:px-0">
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              <span className="text-xs sm:text-sm">Connecting to Bimble...</span>
            </div>
          )}
          {isTyping && (
            <div className="flex gap-2 sm:gap-3 justify-start">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0">
                <BimbleLogoIcon width={24} height={24} />
              </div>
              <div className="bg-gray-100 px-3 py-2 sm:px-4 sm:py-3 rounded-2xl max-w-[80%] sm:max-w-none">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-gray-500" />
                  <span className="text-xs sm:text-sm text-gray-500">Clinical Assistant is typing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length >= 2 && !messages.some(m => m.type === "user" && (m.content.toLowerCase().includes("start") || m.content.toLowerCase().includes("yes") || m.content.toLowerCase().includes("skip"))) && (
          <div className="p-3 sm:p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => sendMessage("Yes, let's start the assessment")}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium text-sm sm:text-base shadow-sm hover:shadow-md"
              >
                Start Assessment
              </button>
              <button
                onClick={() => sendMessage("I'll skip the assessment for now")}
                className="px-4 py-2.5 sm:px-6 sm:py-3 text-gray-600 border border-gray-300 rounded-lg sm:rounded-xl hover:bg-white hover:border-gray-400 transition-all duration-200 font-medium text-sm sm:text-base"
              >
                Skip for Now
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2 sm:mt-3 px-2">
              Assessment takes ~2 minutes and helps your doctor provide better care
            </p>
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 sm:p-6 border-t border-gray-200 bg-white">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask me anything about your appointment..."
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors text-sm sm:text-base"
                disabled={isConnecting}
              />
            </div>

            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 flex-shrink-0 ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:shadow-md"
              }`}
              disabled={isConnecting}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>

            <button
              type="submit"
              disabled={!inputText.trim() || isConnecting}
              className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg sm:rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex-shrink-0"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </form>

          {isRecording && (
            <div className="mt-2 sm:mt-3 flex items-center gap-2 text-red-500 px-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm">Listening... Click to stop</span>
            </div>
          )}
        </div>

        {/* Hidden Audio Element */}
        <audio ref={audioRef} onEnded={() => {}} onError={() => {}} />
      </div>
    );
  }

  // Modal version
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <BimbleLogoIcon width={32} height={32} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Clinical Assistant
              </h2>
              <p className="text-sm text-gray-600">
                {isConnecting
                  ? "Connecting..."
                  : "Ready to help you prepare for your appointment"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <ChatMessageComponent key={message.id} message={message} />
          ))}
          {isConnecting && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Connecting to clinical assistant...</span>
            </div>
          )}
          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <BimbleLogoIcon width={32} height={32} />
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500">Clinical Assistant is typing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length >= 2 && !messages.some(m => m.type === "user" && (m.content.toLowerCase().includes("start") || m.content.toLowerCase().includes("yes") || m.content.toLowerCase().includes("skip"))) && (
          <div className="p-3 sm:p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => sendMessage("Yes, let's start the assessment")}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium text-sm sm:text-base shadow-sm hover:shadow-md"
              >
                Start Assessment
              </button>
              <button
                onClick={() => sendMessage("I'll skip the assessment for now")}
                className="px-4 py-2.5 sm:px-6 sm:py-3 text-gray-600 border border-gray-300 rounded-lg sm:rounded-xl hover:bg-white hover:border-gray-400 transition-all duration-200 font-medium text-sm sm:text-base"
              >
                Skip for Now
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2 sm:mt-3 px-2">
              Assessment takes ~2 minutes and helps your doctor provide better care
            </p>
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 sm:p-6 border-t border-gray-200 bg-white">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask me anything about your appointment..."
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors text-sm sm:text-base"
                disabled={isConnecting}
              />
            </div>

            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 flex-shrink-0 ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:shadow-md"
              }`}
              disabled={isConnecting}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>

            <button
              type="submit"
              disabled={!inputText.trim() || isConnecting}
              className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg sm:rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex-shrink-0"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </form>

          {isRecording && (
            <div className="mt-2 sm:mt-3 flex items-center gap-2 text-red-500 px-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm">Listening... Click to stop</span>
            </div>
          )}
        </div>

        {/* Hidden Audio Element */}
        <audio ref={audioRef} onEnded={() => {}} onError={() => {}} />
      </div>
  );
}

// Chat Message Component
function ChatMessageComponent({ message }: { message: ChatMessage }) {
  const [showStructuredData, setShowStructuredData] = useState(false);

  return (
    <div
      className={`flex gap-2 sm:gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
    >
      {message.type === "ai" && (
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0">
          <BimbleLogoIcon width={24} height={24} />
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[80%] ${message.type === "user" ? "order-first" : ""}`}
      >
        <div
          className={`px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl ${
            message.type === "user"
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              : "bg-gray-100 text-gray-900"
          }`}
        >
          {message.isStreaming ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              <span className="text-xs sm:text-sm">Clinical Assistant is thinking...</span>
            </div>
          ) : (
            <div>
              <p className="text-xs sm:text-sm leading-relaxed">{message.content}</p>

              {message.structuredData && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowStructuredData(!showStructuredData)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showStructuredData
                      ? "Hide Details"
                      : "Show Medical Analysis"}
                  </button>

                  {showStructuredData && (
                    <div className="mt-2 space-y-2 text-xs">
                      {message.structuredData.findings && (
                        <div>
                          <strong>Findings:</strong>
                          <ul className="list-disc list-inside ml-2">
                            {message.structuredData.findings.map(
                              (finding, index) => (
                                <li key={index}>{finding}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}

                      {message.structuredData.differentials && (
                        <div>
                          <strong>Assessment:</strong>
                          <ul className="list-disc list-inside ml-2">
                            {message.structuredData.differentials.map(
                              (diff, index) => (
                                <li key={index}>
                                  {diff.condition} ({diff.likelihood})
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}

                      {message.structuredData.followup && (
                        <div>
                          <strong>Follow-up:</strong>
                          <ul className="list-disc list-inside ml-2">
                            {message.structuredData.followup.map(
                              (item, index) => (
                                <li key={index}>{item}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}

                      {message.structuredData.confidence && (
                        <div>
                          <strong>Confidence:</strong>{" "}
                          {Math.round(message.structuredData.confidence * 100)}%
                        </div>
                      )}

                      {message.structuredData.disclaimer && (
                        <div className="text-orange-600 italic">
                          <strong>Note:</strong>{" "}
                          {message.structuredData.disclaimer}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className={`text-xs text-gray-500 mt-1 ${message.type === "user" ? "text-right" : "text-left"}`}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {message.type === "user" && (
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
        </div>
      )}
    </div>
  );
}
