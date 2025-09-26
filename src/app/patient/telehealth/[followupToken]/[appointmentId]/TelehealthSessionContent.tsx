"use client";

import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  TelehealthVideoPanel,
  TelehealthChatPanel,
  TelehealthCallControls,
  PermissionRequestModal,
  TelehealthChatLauncher,
  type TelehealthChatMessage,
} from "@/components/telehealth";
import { useVonageSession, CALL_STATUSES, type CallStatus } from "@/lib/telehealth/useVonageSession";
import { useChatApi } from "@/lib/services/chatApiService";
import { useWaitingRoomService } from "@/lib/services/waitingRoomService";
import { useAblyVideoCallService, type AblyConnectEvent } from "@/lib/services/ablyVideoCallService";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Shield, X } from "lucide-react";

interface TelehealthSessionContentProps {
  sessionId: string;
  scheduledTime: string;
  providerName: string;
  sessionTitle: string;
  participants: Array<{ name: string; role: string }>;
  messages: TelehealthChatMessage[];
  followupToken: string;
  appointmentId: string;
}

export function TelehealthSessionContent({
  sessionId,
  scheduledTime,
  providerName,
  sessionTitle,
  participants,
  messages,
  followupToken,
  appointmentId,
}: TelehealthSessionContentProps) {
  const [remoteContainer, setRemoteContainer] = useState<HTMLDivElement | null>(null);
  const [localContainer, setLocalContainer] = useState<HTMLDivElement | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastReadIndex, setLastReadIndex] = useState(0);

  // Pre-join flow state
  const [showPreJoin, setShowPreJoin] = useState(true);
  const [pendingJoin, setPendingJoin] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  
  // Picture-in-Picture state
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  
  // Waiting room state
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [doctorConnected, setDoctorConnected] = useState(false);
  const [ablyService, setAblyService] = useState<any>(null);

  // Permission status tracking
  type PermState = "granted" | "denied" | "prompt" | "unsupported";
  const [cameraPerm, setCameraPerm] = useState<PermState>("prompt");
  const [micPerm, setMicPerm] = useState<PermState>("prompt");

  // Chat API integration (background persistence only)
  const chatApi = useChatApi(appointmentId, followupToken);
  
  // State for previous chat messages (API) and loading status
  const [previousMessages, setPreviousMessages] = useState<TelehealthChatMessage[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  
  // Waiting room service
  const waitingRoomService = useWaitingRoomService(appointmentId);

  const handleRemoteContainerReady = useCallback((element: HTMLDivElement | null) => {
    setRemoteContainer(element);
  }, []);

  const handleLocalContainerReady = useCallback((element: HTMLDivElement | null) => {
    setLocalContainer(element);
  }, []);

  const telehealth = useVonageSession({
    appointmentId,
    followupToken,
    participantName: "Patient",
    remoteContainer,
    localContainer,
  });

  // Safe join handler that prevents multiple clicks
  const handleJoinCall = useCallback(async () => {
    if (isJoining || telehealth.isBusy || telehealth.isConnected) {
      console.log('🚫 Join call blocked - already in progress or connected');
      return;
    }

    try {
      setIsJoining(true);
      console.log('🚀 Starting join call process...');
      await telehealth.join();
    } catch (error) {
      console.error('❌ Join call failed:', error);
    } finally {
      setIsJoining(false);
    }
  }, [isJoining, telehealth.isBusy, telehealth.isConnected, telehealth.join]);

  // Picture-in-Picture toggle handler
  const handleTogglePictureInPicture = useCallback(async () => {
    console.log('🎬 Main PiP: Toggle requested');
    console.log('🎬 Main PiP: Current state:', { isPictureInPicture, documentPiP: !!document.pictureInPictureElement });
    
    try {
      if (isPictureInPicture) {
        console.log('🎬 Main PiP: Exiting Picture-in-Picture mode');
        if (document.exitPictureInPicture) {
          await document.exitPictureInPicture();
          console.log('✅ Main PiP: Successfully exited Picture-in-Picture');
        }
      } else if (document.pictureInPictureEnabled) {
        console.log('🎬 Main PiP: Entering Picture-in-Picture mode');
        
        // Try to find a video element first (preferred for PiP)
        const videoElement = document.querySelector('[data-video-panel] video') as HTMLVideoElement;
        console.log('🎬 Main PiP: Found video element:', videoElement);
        
        if (videoElement && videoElement.requestPictureInPicture) {
          console.log('🎬 Main PiP: Using video element for PiP...');
          await videoElement.requestPictureInPicture();
          console.log('✅ Main PiP: Successfully entered Picture-in-Picture via video element');
        } else {
          // Fallback to video panel element
          const videoPanel = document.querySelector('[data-video-panel]') as HTMLElement & {
            requestPictureInPicture?: () => Promise<PictureInPictureWindow>;
          };
          
          console.log('🎬 Main PiP: Video element not found, trying video panel:', videoPanel);
          
          if (videoPanel && videoPanel.requestPictureInPicture) {
            console.log('🎬 Main PiP: Calling requestPictureInPicture on panel...');
            await videoPanel.requestPictureInPicture();
            console.log('✅ Main PiP: Successfully entered Picture-in-Picture via panel');
          } else {
            console.warn('❌ Main PiP: Neither video element nor panel supports requestPictureInPicture');
            console.warn('❌ Main PiP: Available methods on panel:', Object.getOwnPropertyNames(videoPanel || {}));
            
            // Last resort: try to find any video element in the document
            const anyVideo = document.querySelector('video') as HTMLVideoElement;
            if (anyVideo && anyVideo.requestPictureInPicture) {
              console.log('🎬 Main PiP: Found fallback video element:', anyVideo);
              await anyVideo.requestPictureInPicture();
              console.log('✅ Main PiP: Successfully entered Picture-in-Picture via fallback video');
            } else {
              console.error('❌ Main PiP: No video elements found that support Picture-in-Picture');
            }
          }
        }
      } else {
        console.warn('❌ Main PiP: Picture-in-Picture is not supported or enabled');
        console.warn('❌ Main PiP: Browser support check:', {
          pictureInPictureEnabled: document.pictureInPictureEnabled,
          isSecureContext: window.isSecureContext,
          protocol: window.location.protocol,
          userAgent: navigator.userAgent
        });
      }
    } catch (error) {
      console.error('❌ Main PiP: Error toggling Picture-in-Picture:', error);
    }
  }, [isPictureInPicture]);

  // Merge previous messages (API) with current messages (Vonage) for complete chat history
  const uiMessages: TelehealthChatMessage[] = useMemo(() => {
    // Start with previous messages from API (chat history)
    const allMessages = [...previousMessages];
    
    // Add Vonage messages (real-time) - avoid duplicates
    telehealth.chatMessages.forEach(vonageMsg => {
      // Check if this Vonage message already exists in allMessages (including other Vonage messages)
      const exists = allMessages.some(existingMsg => 
        existingMsg.content === vonageMsg.content && 
        existingMsg.author === vonageMsg.author &&
        Math.abs(new Date(existingMsg.authoredAt).getTime() - new Date(vonageMsg.timestamp).getTime()) < 5000
      );
      
      if (!exists) {
        allMessages.push({
          id: vonageMsg.id,
          author: vonageMsg.author,
          authoredAt: vonageMsg.timestamp,
          content: vonageMsg.content,
          isOwn: vonageMsg.isOwn,
        });
      }
    });
    
    // Sort by timestamp to maintain chronological order
    return allMessages.sort((a, b) => 
      new Date(a.authoredAt).getTime() - new Date(b.authoredAt).getTime()
    );
  }, [previousMessages, telehealth.chatMessages]);

  const unreadCount = uiMessages.slice(lastReadIndex).filter(m => !m.isOwn).length;


  // Background API save for user messages (when user sends via Vonage)
  useEffect(() => {
    const userMessages = telehealth.chatMessages.filter(msg => msg.isOwn);
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    if (lastUserMessage) {
      // Save user's message to API in background (don't block UI)
      setTimeout(async () => {
        try {
          console.log('💾 Saving user message to API in background:', lastUserMessage.content);
          await chatApi.sendMessage(lastUserMessage.content);
          console.log('✅ User message saved to API');
        } catch (error) {
          console.warn('❌ Failed to save user message to API:', error);
        }
      }, 0);
    }
  }, [telehealth.chatMessages, chatApi]);

  // Load previous chat messages ONCE when session starts (for chat history)
  useEffect(() => {
    if (appointmentId && followupToken && telehealth.isConnected && !messagesLoaded) {
      console.log('📱 Loading previous chat history from API...');
      
      chatApi.getMessages()
        .then(messages => {
          console.log('📱 Loaded previous messages from API:', messages.length);
          // Convert API messages to UI format
          const convertedMessages = chatApi.convertToVonageFormat(messages).map(msg => ({
            id: msg.id,
            author: msg.author,
            authoredAt: msg.timestamp,
            content: msg.content,
            isOwn: msg.isOwn,
          }));
          setPreviousMessages(convertedMessages); // Store in state for UI display
          setMessagesLoaded(true); // Mark as loaded to prevent re-loading
        })
        .catch(error => {
          console.warn('❌ Failed to load previous messages from API:', error);
          setMessagesLoaded(true); // Mark as loaded even if failed
        });
    }
  }, [appointmentId, followupToken, chatApi, telehealth.isConnected, messagesLoaded]);

  // Cleanup Ably service on unmount
  useEffect(() => {
    return () => {
      if (ablyService) {
        ablyService.disconnect();
      }
    };
  }, [ablyService]);

  // Handle Picture-in-Picture events
  useEffect(() => {
    const handlePictureInPictureChange = () => {
      setIsPictureInPicture(!!document.pictureInPictureElement);
    };

    // Log browser support info
    console.log('🔍 PiP Browser Support Check:', {
      pictureInPictureEnabled: document.pictureInPictureEnabled,
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      userAgent: navigator.userAgent,
      hasRequestPictureInPicture: 'requestPictureInPicture' in document.documentElement,
      hasExitPictureInPicture: 'exitPictureInPicture' in document
    });

    // Check if PiP is supported
    if (document.pictureInPictureEnabled) {
      document.addEventListener("enterpictureinpicture", handlePictureInPictureChange);
      document.addEventListener("leavepictureinpicture", handlePictureInPictureChange);
    }

    return () => {
      if (document.pictureInPictureEnabled) {
        document.removeEventListener("enterpictureinpicture", handlePictureInPictureChange);
        document.removeEventListener("leavepictureinpicture", handlePictureInPictureChange);
      }
    };
  }, []);

  // Permission helpers
  const queryPermission = useCallback(async (name: PermissionName): Promise<PermState> => {
    try {
      if (!('permissions' in navigator) || !navigator.permissions?.query) return "unsupported";
      const res = await navigator.permissions.query({ name } as PermissionDescriptor);
      return res.state as PermState;
    } catch {
      return "unsupported";
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    const check = async () => {
      const [cam, mic] = await Promise.all([
        queryPermission('camera' as PermissionName),
        queryPermission('microphone' as PermissionName),
      ]);
      if (!mounted) return;
      setCameraPerm(cam);
      setMicPerm(mic);
    };
    check();
    return () => { mounted = false; };
  }, [queryPermission]);

  // Do not start preview automatically; only after user action (Test devices)

  // Show permission modal when there's a permission error
  const isPermissionError = telehealth.error?.includes('camera and microphone') ||
                           telehealth.error?.includes('Permission') ||
                           telehealth.error?.includes('NotAllowedError');

  React.useEffect(() => {
    if (isPermissionError) setShowPermissionModal(true);
  }, [isPermissionError]);

  const handlePermissionRetry = async () => {
    telehealth.clearError();
    try {
      if (showPreJoin) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach(t => t.stop());
        setCameraPerm('granted');
        setMicPerm('granted');
        setShowPermissionModal(false);
      } else {
        setShowPermissionModal(false);
        setTimeout(() => { void telehealth.join(); }, 100);
      }
    } catch (e) {
      // keep modal open if user blocks again
    }
  };

  const handlePermissionClose = () => setShowPermissionModal(false);

  React.useEffect(() => {
    if (isChatOpen) setLastReadIndex(uiMessages.length);
  }, [isChatOpen, uiMessages.length]);

  // Join flow: ensure containers exist then call join
  React.useEffect(() => {
    if (!showPreJoin && pendingJoin && remoteContainer && localContainer) {
      void telehealth.join();
      setPendingJoin(false);
    }
  }, [showPreJoin, pendingJoin, remoteContainer, localContainer]);

  /* removed test devices flow */
  const onTestDevices = async () => {
    // no-op
    try {
      // Give the hook time to bind and request media; then update statuses
      await new Promise((r) => setTimeout(r, 0));
      const [cam, mic] = await Promise.all([
        queryPermission('camera' as PermissionName),
        queryPermission('microphone' as PermissionName),
      ]);
      setCameraPerm(cam);
      setMicPerm(mic);
      if (cam !== 'granted' || mic !== 'granted') {
        // Fallback: explicitly request to trigger the prompt
        try {
          const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          s.getTracks().forEach(t => t.stop());
          setCameraPerm('granted');
          setMicPerm('granted');
        } catch {
          setShowPermissionModal(true);
        }
      }
    } finally {
      // no-op
    }
  };

  const onJoinWaitlist = async () => {
    if (isJoining || telehealth.isBusy || telehealth.isConnected) {
      console.log('🚫 Join waitlist blocked - already in progress or connected');
      return;
    }

    try {
      setIsJoining(true);
      // 1. Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(t => t.stop());
      setCameraPerm('granted');
      setMicPerm('granted');
      
      // 2. Mark patient as waiting in the waiting room via API
      console.log('🚪 Joining waitlist - marking patient as waiting...');
      await waitingRoomService.markPatientAsWaiting(followupToken);
      console.log('✅ Patient successfully marked as waiting');
      
      // 3. Start listening for doctor connect events via Ably
      console.log('🎧 Starting Ably listener for doctor connect events...');
      const ablyService = useAblyVideoCallService({
        appointmentId,
        onDoctorConnect: async (event: AblyConnectEvent) => {
          console.log('👨‍⚕️ Doctor connected event received:', event);
          
          // Automatically start the session when doctor connects
          console.log('🚀 Doctor connected - starting session automatically...');
          
          // Disconnect from Ably since we're joining the session
          if (ablyService) {
            await ablyService.disconnect();
            setAblyService(null);
          }
          
          // Join the Vonage session directly
          setPendingJoin(true);
          setIsInWaitingRoom(false);
          setDoctorConnected(false);
        },
        onError: (error: Error) => {
          console.error('❌ Ably error:', error);
        }
      });
      
      await ablyService.connect();
      setAblyService(ablyService);
      
      // 4. Enter waiting room state
      setIsInWaitingRoom(true);
      setShowPreJoin(false);
      
    } catch (e) {
      console.error('❌ Failed to join waitlist:', e);
      if (e instanceof Error && e.message.includes('Permission denied')) {
        setShowPermissionModal(true);
      } else {
        // Handle API errors or other issues
        console.error('❌ Error joining waitlist:', e);
        // You might want to show an error message to the user here
      }
    } finally {
      setIsJoining(false);
    }
  };


  // Development mode - Direct join call (bypasses waiting room)
  const onJoinCallDirect = async () => {
    if (isJoining || telehealth.isBusy || telehealth.isConnected) {
      console.log('🚫 [DEV] Direct join blocked - already in progress or connected');
      return;
    }

    try {
      console.log('🚀 [DEV] Joining call directly...');
      
      // Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(t => t.stop());
      setCameraPerm('granted');
      setMicPerm('granted');
      
      // Skip waiting room and API calls - go directly to session
      setShowPreJoin(false);
      setPendingJoin(true);
      setIsInWaitingRoom(false);
      setDoctorConnected(false);
      
      console.log('✅ [DEV] Direct join initiated');
      
    } catch (e) {
      console.error('❌ [DEV] Failed to join call directly:', e);
      if (e instanceof Error && e.message.includes('Permission denied')) {
        setShowPermissionModal(true);
      }
    }
  };

  const PermBadge = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className={`flex items-center justify-center gap-2 text-sm sm:text-base ${ok ? 'text-emerald-600' : 'text-rose-600'}`}>
      {ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      <span>{label}</span>
    </div>
  );


  const PreJoin = () => (
    <div className="telehealth-full-viewport bg-background overflow-hidden p-4 lg:p-8 flex items-center justify-center">
      <div className="w-full max-w-5xl grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-semibold">Get ready to join</h2>
          </div>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">We will ask for camera and microphone access so your provider can see and hear you.</p>
          <div className="space-y-3 mb-6">
            <PermBadge ok={cameraPerm === 'granted'} label={`Camera permission: ${cameraPerm}`} />
            <PermBadge ok={micPerm === 'granted'} label={`Microphone permission: ${micPerm}`} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              type="button"
              variant="default"
              size="lg"
              className="w-full sm:w-auto"
              onClick={onJoinWaitlist}
              disabled={isJoining || telehealth.isBusy}
              aria-label="Join the waitlist"
            >
              {isJoining || telehealth.isBusy ? "Joining..." : "Join The Waitlist"}
            </Button>
            
            {/* Development mode - Direct join button */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                onClick={onJoinCallDirect}
                disabled={isJoining || telehealth.isBusy}
                aria-label="Join call directly (dev mode)"
              >
                {isJoining || telehealth.isBusy ? "Joining..." : "🚀 Join Call (Dev)"}
              </Button>
            )}
          </div>
          <div className="mt-6 text-xs sm:text-sm text-gray-500">
            If blocked, click the lock icon in your address bar and enable Camera and Microphone.
          </div>
        </div>
      </div>
    </div>
  );

  const WaitingRoom = () => (
    <div className="telehealth-full-viewport bg-background overflow-hidden p-4 lg:p-8 flex items-center justify-center">
      <div className="w-full max-w-5xl grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-semibold">Waiting for your provider</h2>
          </div>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">
            You're now in the waiting room. We'll notify you when your provider is ready to start the session.
          </p>
          
          {doctorConnected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Your provider is ready! Starting session...</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span>Waiting for provider to connect...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Status display logic for badges (kept for potential overlays)
  const getStatusDisplay = (status: CallStatus, participantCount: number) => {
    switch (status) {
      case CALL_STATUSES.IDLE:
        return { label: "Ready to join", badgeClass: "bg-gray-500 text-white" };
      case CALL_STATUSES.LOADING:
        return { label: "Connecting", badgeClass: "bg-orange-500 text-white" };
      case CALL_STATUSES.CONNECTED:
        if (participantCount > 1) return { label: "Connected", badgeClass: "bg-green-500 text-white" };
        return { label: "Connecting", badgeClass: "bg-orange-500 text-white" };
      case CALL_STATUSES.RECONNECTING:
        return { label: "Reconnecting", badgeClass: "bg-yellow-500 text-white" };
      case CALL_STATUSES.ENDED:
        return { label: "Call ended", badgeClass: "bg-gray-500 text-white" };
      case CALL_STATUSES.ERROR:
        return { label: "Error", badgeClass: "bg-red-500 text-white" };
      default:
        return { label: "Unknown", badgeClass: "bg-gray-500 text-white" };
    }
  };

  const statusDisplay = getStatusDisplay(telehealth.callStatus, telehealth.participantCount);

  if (showPreJoin) {
    return (
      <>
        <PreJoin />
        <PermissionRequestModal isOpen={showPermissionModal} onClose={handlePermissionClose} onRetry={handlePermissionRetry} error={telehealth.error} />
      </>
    );
  }

  if (isInWaitingRoom) {
    return (
      <>
        <WaitingRoom />
        <PermissionRequestModal isOpen={showPermissionModal} onClose={handlePermissionClose} onRetry={handlePermissionRetry} error={telehealth.error} />
      </>
    );
  }

  return (
    <div className="telehealth-full-viewport bg-background overflow-hidden p-0 lg:p-6 pb-[var(--safe-area-bottom)] md:pb-0 h-screen">
      <div className="flex flex-col lg:flex-row h-full gap-0 lg:gap-6">
        {/* Mobile/Tablet: Full screen video, Desktop: Normal layout */}
        <div className="flex-1 flex flex-col min-h-0 h-full lg:flex-1">
          <div className="flex-1 relative overflow-hidden bg-black sm:rounded-xl sm:shadow-lg h-full" data-video-panel>
            <TelehealthVideoPanel
              sessionTitle={sessionTitle}
              providerName={providerName}
              participants={participants}
              localParticipantName="You"
              statusMessage={telehealth.statusMessage}
              onRemoteContainerReady={handleRemoteContainerReady}
              onLocalContainerReady={handleLocalContainerReady}
              signalStrength={telehealth.signalStrength}
              overlayControls={
                <TelehealthCallControls
                  variant="overlay"
                  isConnected={telehealth.isConnected}
                  isBusy={telehealth.isBusy || isJoining}
                  isMicMuted={telehealth.isMicMuted}
                  isCameraOff={telehealth.isCameraOff}
                  onJoin={handleJoinCall}
                  onLeave={telehealth.leave}
                  onToggleMic={telehealth.toggleMic}
                  onToggleCamera={telehealth.toggleCamera}
                  onOpenDeviceSettings={telehealth.switchCamera}
                  onSwitchMicrophone={telehealth.switchMicrophone}
                  signalStrength={telehealth.signalStrength}
                  audioLevel={telehealth.audioLevel}
                  audioDevices={telehealth.audioDevices}
                  currentAudioDevice={telehealth.currentAudioDevice}
                  showChatButton
                  isChatOpen={isChatOpen}
                  chatUnreadCount={unreadCount}
                  onToggleChat={() => setIsChatOpen(v => !v)}
                  onTogglePictureInPicture={handleTogglePictureInPicture}
                  isPictureInPicture={isPictureInPicture}
                />
              }
            />

            {telehealth.error && !isPermissionError && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>{telehealth.error}</span>
                    </div>
                    <button 
                      onClick={() => telehealth.clearError()}
                      className="text-red-500 hover:text-red-700 ml-2 p-1 rounded-full hover:bg-red-100 transition-colors"
                      aria-label="Dismiss error"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Chat Panel (desktop only) */}
        <div className="hidden lg:flex lg:w-96 lg:h-full bg-gray-50 flex-col rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {providerName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800 ${telehealth.isConnected ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-sm truncate">{providerName}</h3>
                <p className="text-gray-400 text-xs">{telehealth.isConnected ? 'Online' : 'Offline'} • Healthcare Provider</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${telehealth.isConnected ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-xs text-gray-400">{telehealth.isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden bg-gray-50">
            <TelehealthChatPanel
              participantName={providerName}
              participantRole="Doctor"
              participantStatus={telehealth.isConnected ? "online" : "offline"}
              messages={uiMessages}
              onSendMessage={telehealth.sendChatMessage}
              isConnected={telehealth.isConnected}
              typingUsers={telehealth.typingUsers}
              onTypingStart={telehealth.sendTypingIndicator}
              onTypingStop={telehealth.stopTypingIndicator}
            />
          </div>
        </div>

        {/* Chat Launcher (mobile/tablet) - controlled, no floating button */}
        <div className="lg:hidden">
          <TelehealthChatLauncher
            participantName={providerName}
            participantRole="Doctor"
            participantStatus={telehealth.isConnected ? "online" : "offline"}
            messages={uiMessages}
            onSendMessage={(content) => telehealth.sendChatMessage(content)}
            isOpen={isChatOpen}
            onToggle={() => setIsChatOpen(v => !v)}
            hideTrigger
            variant="drawer"
            headerTitle="Meeting Chat"
            headerSubtitle={`${telehealth.participantCount} participants in room`}
            participantNames={telehealth.participantCount > 0 ? [...new Set(["You", providerName, ...telehealth.participants.map(p => `Participant ${p.connectionId.slice(-4)}`)])] : []}
          />
        </div>
      </div>

      <PermissionRequestModal isOpen={showPermissionModal} onClose={handlePermissionClose} onRetry={handlePermissionRetry} error={telehealth.error} />
    </div>
  );
}
