"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Mic, MicOff, Send, Loader2, Phone, PhoneOff, Volume2, VolumeX } from "lucide-react";
import { BimbleLogoIcon } from "@/components/icons";

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

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
        "Hi! 👋 I'm your clinical assistant. Your appointment with Dr. Sarah Johnson is confirmed for September 15, 2025 at 2:30 PM at Downtown Medical Center. You can chat with me by text or use Call Mode for voice conversation.",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // Call mode states
  const [callMode, setCallMode] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [micOn, setMicOn] = useState(false);
  const [sttStatus, setSttStatus] = useState("");
  const [sttCommitted, setSttCommitted] = useState("");
  const [sttInterim, setSttInterim] = useState("");
  const [lastUserText, setLastUserText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Speech recognition and TTS refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);
  const autoSendTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resumeVoiceOnStopRef = useRef(true);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Speech recognition and TTS helper functions
  const stopSpeaking = useCallback(() => {
    try {
      window.speechSynthesis.cancel();
    } catch {}
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
      } catch {}
      currentAudioRef.current.src = "";
      currentAudioRef.current = null;
    }
    if (currentAudioUrlRef.current) {
      try {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      } catch {}
      currentAudioUrlRef.current = null;
    }
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    if (!voiceOn) return Promise.resolve();
    stopSpeaking();
    
    return new Promise(async (resolve) => {
      try {
        // Try custom TTS endpoint first
        const response = await fetch("http://127.0.0.1:3012/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });
        
        if (response.ok) {
          const blob = await response.blob();
          currentAudioUrlRef.current = URL.createObjectURL(blob);
          currentAudioRef.current = new Audio(currentAudioUrlRef.current);
          currentAudioRef.current.addEventListener("ended", () => {
            stopSpeaking();
            resolve();
          }, { once: true });
          await currentAudioRef.current.play();
          return;
        }
      } catch (error) {
        console.error("TTS endpoint failed:", error);
      }
      
      // Fallback to browser TTS
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve(); // Resolve even on error to prevent hanging
      window.speechSynthesis.speak(utterance);
    });
  }, [voiceOn, stopSpeaking]);

  const resumeMicSoon = useCallback((delay = 0) => {
    if (!callMode) return;
    setTimeout(() => {
      if (!micOn) {
        startMic();
      }
    }, delay);
  }, [callMode, micOn]);

  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSttStatus("Speech recognition not supported (use Chrome).");
      return null;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onstart = () => {
      setSttStatus(callMode ? "Call Mode: listening…" : "Listening…");
    };
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalHit = false;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setSttCommitted(prev => prev + transcript + " ");
          setSttInterim("");
          finalHit = true;
        } else {
          setSttInterim(transcript + " ");
        }
      }
      
      const combinedText = (sttCommitted + sttInterim).trim();
      setInputText(combinedText);
      
      if (callMode && finalHit) {
        if (autoSendTimerRef.current) {
          clearTimeout(autoSendTimerRef.current);
        }
        autoSendTimerRef.current = setTimeout(() => {
          const utterance = sttCommitted.trim();
          if (utterance) {
            setSttCommitted("");
            setSttInterim("");
            setInputText("");
            sendMessage(utterance, true);
          }
        }, 500);
      }
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setSttStatus("Mic error: " + (event.error || "unknown"));
    };
    
    recognition.onend = () => {
      setSttStatus(micOn ? (callMode ? "Reconnecting mic…" : "Reconnecting…") : "");
      if (micOn) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch {}
        }, 120);
      }
    };
    
    return recognition;
  }, [callMode, micOn, sttCommitted, sttInterim]);

  const startMic = useCallback(() => {
    if (micOn) return;
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }
    if (!recognitionRef.current) return;
    
    if (!callMode) {
      resumeVoiceOnStopRef.current = voiceOn;
      setVoiceOn(false);
      stopSpeaking();
    }
    
    setMicOn(true);
    setSttCommitted("");
    setSttInterim("");
    setSttStatus("Starting mic…");
    
    try {
      recognitionRef.current.start();
    } catch {}
  }, [micOn, callMode, voiceOn, stopSpeaking, initRecognition]);

  const stopMic = useCallback(() => {
    if (!micOn) return;
    setMicOn(false);
    setSttStatus("");
    
    try {
      recognitionRef.current?.stop();
    } catch {}
    
    if (!callMode) {
      setVoiceOn(resumeVoiceOnStopRef.current);
    }
  }, [micOn, callMode]);

  const startCall = useCallback(() => {
    setCallMode(true);
    setVoiceOn(true);
    stopSpeaking();
    startMic();
    
    const callStartMessage: ChatMessage = {
      id: `call-start-${Date.now()}`,
      type: "ai",
      content: "Call started. I'm listening — tell me briefly what's going on.",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, callStartMessage]);
  }, [startMic, stopSpeaking]);

  const endCall = useCallback(() => {
    setCallMode(false);
    stopMic();
    setVoiceOn(false);
    stopSpeaking();
    
    const callEndMessage: ChatMessage = {
      id: `call-end-${Date.now()}`,
      type: "ai",
      content: "Call ended. You can keep chatting by text.",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, callEndMessage]);
  }, [stopMic, stopSpeaking]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cleanup effects
  useEffect(() => {
    return () => {
      // Cleanup speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      
      // Cleanup audio
      stopSpeaking();
      
      // Cleanup timers
      if (autoSendTimerRef.current) {
        clearTimeout(autoSendTimerRef.current);
      }
    };
  }, [stopSpeaking]);


  // Auto-start chat by hitting the stream endpoint
  const startInitialChat = useCallback(async () => {
    const timestamp = Date.now();
    const initialMessage: ChatMessage = {
      id: `ai-${timestamp}`,
      type: "ai",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, initialMessage]);

    try {
      const response = await fetch("http://127.0.0.1:3012/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [{ role: "user", content: "Hello, I'm ready to start our conversation." }], 
          summary: null 
        })
      });

      if (!response.ok || !response.body) {
        throw new Error("LLM unavailable");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistant = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });

        for (const line of chunk.split("\n")) {
          if (!line.trim()) continue;
          if (!line.startsWith("data: ")) continue;
          const jsonLine = line.replace(/^data:\s*/, "");
          if (!jsonLine) continue;
          
          try {
            const evt = JSON.parse(jsonLine);

            if (evt.delta) {
              assistant += evt.delta;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === initialMessage.id
                    ? { ...msg, content: assistant, isStreaming: false }
                    : msg
                )
              );
            }

            if (evt.done) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === initialMessage.id
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              );
              
              // Only speak in call mode
              if (callMode) {
                speak(assistant)
                  .then(() => resumeMicSoon(0))
                  .catch(() => resumeMicSoon(0));
              }
            }
          } catch (parseError) {
            // Ignore parse errors
          }
        }
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === initialMessage.id
            ? { 
                ...msg, 
                content: "⚠️ Failed to start conversation",
                isStreaming: false 
              }
            : msg
        )
      );
      console.error("Start chat error:", error);
    }
  }, []);

  // Initialize connection and start chat
  useEffect(() => {
    if (isOpen && messages.length === 1) {
      setIsConnecting(false);
      // Auto-start the chat by hitting the stream endpoint
      const timer = setTimeout(() => {
        startInitialChat();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages.length, startInitialChat]);


  const sendMessage = useCallback(async (content: string, fromCall = false) => {
    if (!content.trim()) return;

    if (fromCall && callMode) {
      stopMic();
    }

    // Remember for retry
    setLastUserText(content);

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

    let timeoutId: NodeJS.Timeout | null = null;
    let hasReceivedData = false;

    try {
      // Send to HTTP endpoint
      const response = await fetch("http://127.0.0.1:3012/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, userMessage].map(msg => ({
            role: msg.type === "user" ? "user" : "assistant",
            content: msg.content
          })), 
          summary: null // Add summary state if needed
        })
      });

      if (!response.ok || !response.body) {
        throw new Error("LLM unavailable");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistant = "";
      
      // Set a timeout to clear streaming state if no data is received
      timeoutId = setTimeout(() => {
        if (!hasReceivedData) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessage.id
                ? { ...msg, isStreaming: false, content: "⚠️ No response received" }
                : msg
            )
          );
        }
      }, 10000); // 10 second timeout

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });

        for (const line of chunk.split("\n")) {
          if (!line.trim()) continue;
          if (!line.startsWith("data: ")) continue;
          const jsonLine = line.replace(/^data:\s*/, "");
          if (!jsonLine) continue;
          
          try {
            const evt = JSON.parse(jsonLine);

            if (evt.delta) {
              hasReceivedData = true;
              if (timeoutId) clearTimeout(timeoutId);
              assistant += evt.delta;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessage.id
                    ? { ...msg, content: assistant, isStreaming: false }
                    : msg
                )
              );
            }

            if (evt.warning) {
              console.warn("Warning:", evt.warning);
            }

            if (evt.done) {
              if (timeoutId) clearTimeout(timeoutId);
              // Mark streaming as complete
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessage.id
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              );

              // Speak the response and resume mic only in call mode
              if (callMode) {
                speak(assistant)
                  .then(() => resumeMicSoon(0))
                  .catch(() => resumeMicSoon(0));
              }
            }

            if (evt.error) {
              if (timeoutId) clearTimeout(timeoutId);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessage.id
                    ? { 
                        ...msg, 
                        content: `⚠️ ${evt.error}`,
                        isStreaming: false 
                      }
                    : msg
                )
              );
            }
          } catch (parseError) {
            // Ignore parse errors
          }
        }
      }
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessage.id
            ? { 
                ...msg, 
                content: "⚠️ Network error",
                isStreaming: false 
              }
            : msg
        )
      );
      console.error("Send message error:", error);
    }

    setInputText("");
  }, [callMode, stopMic, speak, resumeMicSoon, messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const retryMessage = useCallback(() => {
    if (lastUserText) {
      sendMessage(lastUserText, callMode);
    }
  }, [lastUserText, sendMessage, callMode]);

  const startRecording = async () => {
    if (callMode) {
      startMic();
      return;
    }

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
        
        // TODO: Send audio to backend for speech-to-text conversion
        // For now, just log the audio blob
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (callMode) {
      stopMic();
      return;
    }

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
            <div className="flex items-center gap-2">
              {/* Call Mode Controls */}
              <button
                onClick={() => setVoiceOn(!voiceOn)}
                className={`px-3 py-1.5 rounded-lg text-white text-sm transition-colors ${
                  voiceOn 
                    ? "bg-slate-600 hover:bg-slate-700" 
                    : "bg-slate-500 hover:bg-slate-600"
                }`}
              >
                {voiceOn ? (
                  <>
                    <Volume2 className="h-4 w-4 inline mr-1" />
                    Voice: On
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4 inline mr-1" />
                    Voice: Off
                  </>
                )}
              </button>
              
              <button
                onClick={micOn ? stopMic : startMic}
                className={`px-3 py-1.5 rounded-lg text-white text-sm transition-colors ${
                  micOn 
                    ? "bg-slate-600 hover:bg-slate-700" 
                    : "bg-slate-500 hover:bg-slate-600"
                }`}
              >
                {micOn ? (
                  <>
                    <Mic className="h-4 w-4 inline mr-1" />
                    Mic: On
                  </>
                ) : (
                  <>
                    <MicOff className="h-4 w-4 inline mr-1" />
                    Mic: Off
                  </>
                )}
              </button>
              
              
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
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
          {messages.map((message) => (
            <ChatMessageComponent 
              key={message.id} 
              message={message} 
              onRetry={retryMessage}
            />
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
        {/* {messages.length >= 2 && !messages.some(m => m.type === "user" && (m.content.toLowerCase().includes("start") || m.content.toLowerCase().includes("yes") || m.content.toLowerCase().includes("skip"))) && (
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
        )} */}

        {/* Input Area */}
        <div className="p-3 sm:p-6 border-t border-gray-200 bg-white">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={callMode ? "In Call Mode just talk..." : "Ask me anything about your appointment..."}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors text-sm sm:text-base"
                disabled={isConnecting}
              />
            </div>

            <button
              type="button"
              onClick={callMode ? endCall : startCall}
              className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 flex-shrink-0 ${
                callMode
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg"
                  : "bg-green-500 hover:bg-green-600 text-white hover:shadow-md"
              }`}
              disabled={isConnecting}
            >
              {callMode ? (
                <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
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

          {/* STT Status */}
          {sttStatus && (
            <div className="mt-2 sm:mt-3 flex items-center gap-2 text-blue-600 px-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm italic">{sttStatus}</span>
            </div>
          )}

          {(isRecording || micOn) && !sttStatus && (
            <div className="mt-2 sm:mt-3 flex items-center gap-2 text-red-500 px-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm">
                {callMode ? "Call Mode: listening..." : "Listening... Click to stop"}
              </span>
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
          <div className="flex items-center gap-2">
            {/* Call Mode Controls */}
            <button
              onClick={() => setVoiceOn(!voiceOn)}
              className={`px-3 py-1.5 rounded-lg text-white text-sm transition-colors ${
                voiceOn 
                  ? "bg-slate-600 hover:bg-slate-700" 
                  : "bg-slate-500 hover:bg-slate-600"
              }`}
            >
              {voiceOn ? (
                <>
                  <Volume2 className="h-4 w-4 inline mr-1" />
                  Voice: On
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4 inline mr-1" />
                  Voice: Off
                </>
              )}
            </button>
            
            <button
              onClick={micOn ? stopMic : startMic}
              className={`px-3 py-1.5 rounded-lg text-white text-sm transition-colors ${
                micOn 
                  ? "bg-slate-600 hover:bg-slate-700" 
                  : "bg-slate-500 hover:bg-slate-600"
              }`}
            >
              {micOn ? (
                <>
                  <Mic className="h-4 w-4 inline mr-1" />
                  Mic: On
                </>
              ) : (
                <>
                  <MicOff className="h-4 w-4 inline mr-1" />
                  Mic: Off
                </>
              )}
            </button>
            
            <button
              onClick={() => setInputText("I'm a 45-year-old male with back pain for the last 2 days.")}
              className="px-3 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-700 text-white text-sm transition-colors"
            >
              Prefill Back Pain Case
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <ChatMessageComponent 
              key={message.id} 
              message={message} 
              onRetry={retryMessage}
            />
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
        {/* {messages.length >= 2 && !messages.some(m => m.type === "user" && (m.content.toLowerCase().includes("start") || m.content.toLowerCase().includes("yes") || m.content.toLowerCase().includes("skip"))) && (
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
        )} */}

        {/* Input Area */}
        <div className="p-3 sm:p-6 border-t border-gray-200 bg-white">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={callMode ? "In Call Mode just talk..." : "Ask me anything about your appointment..."}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors text-sm sm:text-base"
                disabled={isConnecting}
              />
            </div>

            <button
              type="button"
              onClick={callMode ? endCall : startCall}
              className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 flex-shrink-0 ${
                callMode
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg"
                  : "bg-green-500 hover:bg-green-600 text-white hover:shadow-md"
              }`}
              disabled={isConnecting}
            >
              {callMode ? (
                <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
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

          {/* STT Status */}
          {sttStatus && (
            <div className="mt-2 sm:mt-3 flex items-center gap-2 text-blue-600 px-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm italic">{sttStatus}</span>
            </div>
          )}

          {(isRecording || micOn) && !sttStatus && (
            <div className="mt-2 sm:mt-3 flex items-center gap-2 text-red-500 px-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm">
                {callMode ? "Call Mode: listening..." : "Listening... Click to stop"}
              </span>
            </div>
          )}
        </div>

        {/* Hidden Audio Element */}
        <audio ref={audioRef} onEnded={() => {}} onError={() => {}} />
      </div>
  );
}

// Chat Message Component
function ChatMessageComponent({ 
  message, 
  onRetry 
}: { 
  message: ChatMessage;
  onRetry?: () => void;
}) {
  const [showStructuredData, setShowStructuredData] = useState(false);

  return (
    <div
      className={`flex gap-2 sm:gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
    >

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
              <p className="text-xs sm:text-sm leading-relaxed">
                {message.content}
                {message.content.includes("⚠️") && onRetry && (
                  <button
                    onClick={onRetry}
                    className="ml-2 underline text-blue-300 hover:text-blue-200"
                  >
                    Retry
                  </button>
                )}
              </p>

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

    </div>
  );
}
