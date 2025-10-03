"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  TelehealthVideoPanel,
  TelehealthChatPanel,
  TelehealthCallControls,
  PermissionRequestModal,
  TelehealthChatLauncher,
  type TelehealthChatMessage,
} from "@/components/telehealth";
import { useVonageSession } from "@/lib/telehealth/useVonageSession";
import { useChatApi } from "@/lib/services/chatApiService";
import { useWaitingRoomService } from "@/lib/services/waitingRoomService";
import { useVideoEventsService } from "@/lib/services/videoEventsService";
import { AblyVideoCallService, type AblyConnectEvent } from "@/lib/services/ablyVideoCallService";
import { patientService } from "@/lib/services/patientService";
import { AppointmentStateData } from "@/lib/types/api";
import { API_CONFIG } from "@/lib/config/api";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, X, Lock } from "lucide-react";

interface TelehealthSessionContentProps {
  sessionId: string;
  scheduledTime: string;
  providerName: string;
  sessionTitle: string;
  participants: Array<{ name: string; role: string }>;
  messages: TelehealthChatMessage[];
  followupToken: string;
  appointmentId: string;
  appointmentState: AppointmentStateData | null;
}

export function TelehealthSessionContent({
  providerName,
  sessionTitle,
  participants: _participants,
  followupToken,
  appointmentId,
  appointmentState: initialAppointmentState,
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
  const [autoStartFailed, setAutoStartFailed] = useState(false);
  
  // Picture-in-Picture state (now managed by the hook)
  const [pipPreferenceEnabled, setPipPreferenceEnabled] = useState(false);
  
  // Waiting room state
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [doctorConnected, setDoctorConnected] = useState(false);
  const [ablyService, setAblyService] = useState<AblyVideoCallService | null>(null);

  // Permission status tracking
  type PermState = "granted" | "denied" | "prompt" | "unsupported";
  const [cameraPerm, setCameraPerm] = useState<PermState>("prompt");
  const [micPerm, setMicPerm] = useState<PermState>("prompt");

  // Chat API integration (background persistence only)
  const chatApi = useChatApi(appointmentId, followupToken);
  
  // State for previous chat messages (API) and loading status
  const [previousMessages, setPreviousMessages] = useState<TelehealthChatMessage[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  
  // Appointment state - always fetch client-side
  const [appointmentState, setAppointmentState] = useState<AppointmentStateData | null>(null);
  const [appointmentStateLoaded, setAppointmentStateLoaded] = useState(false);
  
  // Debug logging
  React.useEffect(() => {
    console.log("🔍 Client-side: Current appointment state:", appointmentState);
    console.log("🔍 Client-side: Appointment state loaded:", appointmentStateLoaded);
    if (appointmentState) {
      console.log("🔍 Client-side: Doctor name:", appointmentState.doctor?.full_name);
      console.log("🔍 Client-side: Appointment time:", appointmentState.scheduled_for);
      console.log("🔍 Client-side: is_with_doctor:", appointmentState.is_with_doctor);
      console.log("🔍 Client-side: is_waiting:", appointmentState.is_waiting);
      
      // Determine which button will show
      let buttonText = "Join Waiting Room";
      if (appointmentState.is_with_doctor) {
        buttonText = "Start Your Appointment";
      } else if (appointmentState.is_waiting) {
        buttonText = "Continue Waiting";
      }
      console.log("🔍 Client-side: Button will show:", buttonText);
    }
  }, [appointmentState, appointmentStateLoaded]);

  // Always fetch appointment state on client-side when component mounts
  React.useEffect(() => {
    if (!appointmentStateLoaded && appointmentId && followupToken) {
      console.log("🔄 Client-side: Fetching appointment state...");
      console.log("🔄 Client-side: appointmentId:", appointmentId);
      console.log("🔄 Client-side: followupToken:", followupToken);
      
      patientService.getAppointmentState(appointmentId, followupToken)
        .then(response => {
          console.log("📡 Client-side: Full API response:", JSON.stringify(response, null, 2));
          if (response.success && response.data) {
            console.log("📡 Client-side: Appointment data:", JSON.stringify(response.data, null, 2));
            console.log("📡 Client-side: is_with_doctor:", response.data.is_with_doctor);
            console.log("📡 Client-side: is_waiting:", response.data.is_waiting);
            console.log("📡 Client-side: status:", response.data.status);
            console.log("📡 Client-side: doctor info:", response.data.doctor);
            
            setAppointmentState(response.data);
            console.log("✅ Client-side: Successfully fetched appointment state");
          } else {
            console.log("❌ Client-side: API call failed or returned no data");
            console.log("❌ Client-side: Response success:", response.success);
            console.log("❌ Client-side: Response data:", response.data);
          }
          setAppointmentStateLoaded(true);
        })
        .catch(error => {
          console.error("💥 Client-side: Failed to fetch appointment state:", error);
          setAppointmentStateLoaded(true);
        });
    }
  }, [appointmentStateLoaded, appointmentId, followupToken]);

  // Auto-start session when doctor is ready
  React.useEffect(() => {
    console.log("🔍 Auto-start check:", {
      is_with_doctor: appointmentState?.is_with_doctor,
      appointmentStateLoaded,
      showPreJoin,
      autoStartFailed,
      appointmentState: appointmentState
    });
    
    if (appointmentState?.is_with_doctor && appointmentStateLoaded && showPreJoin && !autoStartFailed) {
      console.log("🚀 Auto-starting session - doctor is ready!");
      console.log("🚀 Auto-start: appointmentState.is_with_doctor =", appointmentState.is_with_doctor);
      // Small delay to ensure UI is ready
      setTimeout(() => {
        try {
          console.log("🚀 Auto-start: Calling onJoinCallDirect()");
          onJoinCallDirect();
        } catch (error) {
          console.error("❌ Auto-start failed:", error);
          setAutoStartFailed(true);
        }
      }, 1000);
    }
  }, [appointmentState?.is_with_doctor, appointmentStateLoaded, showPreJoin, autoStartFailed]);
  
  // Waiting room service
  const waitingRoomService = useWaitingRoomService(appointmentId);
  const videoEventsService = useVideoEventsService(appointmentId);

  const handleRemoteContainerReady = useCallback((element: HTMLDivElement | null) => {
    setRemoteContainer(element);
  }, []);

  const handleLocalContainerReady = useCallback((element: HTMLDivElement | null) => {
    setLocalContainer(element);
  }, []);

  const telehealth = useVonageSession({
    appointmentId,
    followupToken,
    participantName: " ",
    remoteContainer,
    localContainer,
  });


  // Safe join handler that prevents multiple clicks
  const handleJoinCall = useCallback(async () => {
    if (isJoining || telehealth.isBusy || telehealth.isConnected) {
      return;
    }

    try {
      setIsJoining(true);
      await telehealth.join();
    } catch (error) {
    } finally {
      setIsJoining(false);
    }
  }, [isJoining, telehealth]);

  // Simple PiP toggle handler (delegate to hook)
  const handleTogglePictureInPicture = useCallback(async () => {
    // Go directly to PiP without showing the nudge banner
    // Enable follow speaker and trigger PiP directly
    telehealth.enablePiPFollowSpeaker();
    // The video panel will handle the actual PiP request
  }, [telehealth]);



  // Current View PiP handler (for explicit "Current View" button)
  const handleCurrentViewPiP = useCallback(async () => {
    // This will be handled by the TelehealthVideoPanel component
  }, []);

  // Note: All PiP functions are now handled directly by the hook
  

  // Listen for PiP events (now handled by the hook)

  // Media Session metadata (nice-to-have)
  useEffect(() => {
    if (!telehealth.isConnected) return;

    // Media Session metadata (nice-to-have)
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: sessionTitle,
          artist: providerName,
          album: 'Video Call',
        });
      } catch {}
    }
  }, [telehealth.isConnected, providerName, sessionTitle]);

  // Merge previous messages (API) with current messages (Vonage) for complete chat history
  const uiMessages: TelehealthChatMessage[] = useMemo(() => {
    // Start with previous messages from API (chat history)
    const allMessages = [...previousMessages];
    
    // Add Vonage messages (real-time) - avoid duplicates
    telehealth.chatMessages.forEach(vonageMsg => {
      // Check if this Vonage message already exists in allMessages
      // Use more strict deduplication: same content + same author + within 10 seconds
      const exists = allMessages.some(existingMsg => 
        existingMsg.content === vonageMsg.content && 
        existingMsg.author === vonageMsg.author &&
        existingMsg.isOwn === vonageMsg.isOwn &&
        Math.abs(new Date(existingMsg.authoredAt).getTime() - new Date(vonageMsg.timestamp).getTime()) < 10000
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
          await chatApi.sendMessage(lastUserMessage.content);
        } catch (error) {
        }
      }, 0);
    }
  }, [telehealth.chatMessages, chatApi]);

  // Appointment state is now passed from server-side props, no need for client-side API call

  // Load previous chat messages ONCE when session starts (for chat history)
  useEffect(() => {
    if (appointmentId && followupToken && telehealth.isConnected && !messagesLoaded) {
      
      chatApi.getMessages()
        .then(messages => {
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

  // On tab switch / app blur: show PiP nudge
  useEffect(() => {
    const handleTabSwitch = async () => {
      if (!telehealth.isConnected || document.pictureInPictureElement) return;
      
      // Show PiP nudge on tab switch
      telehealth.setPendingPiPRequest(true);
    };

    const onVis = () => { if (document.hidden) handleTabSwitch(); };
    const onBlur = () => handleTabSwitch();
    const onResize = () => {
      if (window.outerHeight < 100) handleTabSwitch(); // minimized-ish
    };

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    window.addEventListener('resize', onResize);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', onResize);
    };
  }, [telehealth.isConnected]);

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
      
      // Restore PiP preference from localStorage
      const storedPipPreference = localStorage.getItem('pip-preference-enabled');
      if (storedPipPreference === 'true') {
        setPipPreferenceEnabled(true);
      }
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
    } catch {
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
  }, [showPreJoin, pendingJoin, remoteContainer, localContainer, telehealth]);


  const onJoinWaitlist = async () => {
    if (isJoining || telehealth.isBusy || telehealth.isConnected) {
      return;
    }

    try {
      setIsJoining(true);
      // 1. Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(t => t.stop());
          setCameraPerm('granted');
          setMicPerm('granted');
      
      // Note: PiP permission will be requested after session starts
      
      // 2. Mark patient as waiting in the waiting room via API
      const waitingResponse = await waitingRoomService.markPatientAsWaiting(followupToken);
      
      // 2.5. Trigger video event for patient waiting
      if (waitingResponse.success && waitingResponse.data) {
        try {
          await videoEventsService.triggerPatientWaitingEvent(followupToken, {
            id: waitingResponse.data.id,
            is_waiting: waitingResponse.data.is_waiting,
            waiting_since: waitingResponse.data.waiting_since
          });
        } catch (videoEventError) {
          // Don't fail the entire flow if video event fails
        }
      }
      
      // 3. Start listening for doctor connect events via Ably
      const newAblyService = new AblyVideoCallService({
        appointmentId,
        clinicId: API_CONFIG.CLINIC_ID, // Pass clinic ID for MOA calling events
        onDoctorConnect: async (event: AblyConnectEvent) => {
          console.log('🚀 Ably: Received doctor/MOA connect event:', JSON.stringify(event, null, 2));
          console.log('🚀 Ably: Event type:', event.event);
          console.log('🚀 Ably: Event metadata:', event.metadata);
          console.log('🚀 Ably: Event context:', event.context);
          
          // Automatically start the session when doctor or MOA connects
          if (event.event === 'connect') {
            console.log('👨‍⚕️ Doctor connected - starting session');
            console.log('👨‍⚕️ Doctor ID:', event.context.actor.id);
            console.log('👨‍⚕️ Doctor name:', event.context.actor.name);
          } else if (event.event === 'moa-calling') {
            console.log('👩‍💼 MOA calling - starting session');
            console.log('👩‍💼 MOA ID:', event.context.actor.id);
            console.log('👩‍💼 MOA name:', event.context.actor.name);
            console.log('👩‍💼 MOA type:', event.context.actor.type);
            console.log('👩‍💼 Clinic ID:', event.context.actor.clinic_id);
          }
          
          // Disconnect from Ably since we're joining the session
          if (ablyService) {
            console.log('🔌 Ably: Disconnecting from Ably service...');
            await ablyService.disconnect();
            setAblyService(null);
          }
          
          // Join the Vonage session directly
          console.log('🚀 Ably: Setting pending join and exiting waiting room...');
          setPendingJoin(true);
          setIsInWaitingRoom(false);
          setDoctorConnected(false);
        },
        onError: (error: Error) => {
          console.error('❌ Ably: Error in video call service:', error);
        }
      });
      
      await newAblyService.connect();
      setAblyService(newAblyService);
      
      // 4. Enter waiting room state
      setIsInWaitingRoom(true);
      setShowPreJoin(false);
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('Permission denied')) {
          setShowPermissionModal(true);
      } else {
        // Handle API errors or other issues
        // You might want to show an error message to the user here
      }
    } finally {
      setIsJoining(false);
    }
  };


  // Development mode - Direct join call (bypasses waiting room)
  const onJoinCallDirect = async () => {
    if (isJoining || telehealth.isBusy || telehealth.isConnected) {
      return;
    }

    try {
      
      // Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(t => t.stop());
      setCameraPerm('granted');
      setMicPerm('granted');
      
      // Note: PiP permission will be requested after session starts
      
      // Skip waiting room and API calls - go directly to session
      setShowPreJoin(false);
      setPendingJoin(true);
      setIsInWaitingRoom(false);
      setDoctorConnected(false);
      
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('Permission denied')) {
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


  const PreJoin = () => {
    // Format appointment time
    const formatAppointmentTime = (scheduledFor: string) => {
      try {
        const date = new Date(scheduledFor);
        return date.toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } catch {
        return null;
      }
    };

    const doctorName = appointmentState?.doctor?.full_name;
    const appointmentTime = appointmentState?.scheduled_for ? formatAppointmentTime(appointmentState.scheduled_for) : null;
    const isDoctorReady = appointmentState?.is_with_doctor;
    const isWaiting = appointmentState?.is_waiting;
    
    console.log('🎨 PreJoin UI State:', {
      doctorName,
      appointmentTime,
      isDoctorReady,
      isWaiting,
      appointmentState: appointmentState,
      showPreJoin,
      autoStartFailed
    });

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              {isDoctorReady ? "Ready to start" : "Virtual meeting"}
            </h1>
            <p className="text-gray-600 flex items-center justify-center gap-2">
              {isDoctorReady ? (
                "Your healthcare provider is ready to see you"
              ) : (
                <>
                  <Lock className="h-4 w-4 text-blue-600" />
                  Secure video consultation
                </>
              )}
            </p>
          </div>

          {/* Doctor Info */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            {!appointmentStateLoaded ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-48"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {doctorName ? doctorName.split(' ').map(n => n[0]).join('').slice(0, 2) : 'P'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{doctorName ? `Dr. ${doctorName}` : 'Provider'}</h3>
                  <p className="text-sm text-gray-500">
                    {isDoctorReady ? "Ready to see you now" : appointmentTime ? (
                      <>
                        Scheduled for <span className="font-semibold">{appointmentTime}</span>
                      </>
                    ) : "Scheduled appointment"}
                  </p>
                </div>
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {isDoctorReady ? 'Ready' : 'Scheduled'}
                </div>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {isDoctorReady && !autoStartFailed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <p className="font-medium text-green-800">Starting your session automatically...</p>
                  <p className="text-sm text-green-600">Please wait while we connect you</p>
                </div>
              </div>
            </div>
          )}

          {autoStartFailed && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Auto-start failed</p>
                  <p className="text-sm text-gray-600">Please try joining manually</p>
                </div>
              </div>
            </div>
          )}

          {/* Device Status */}
          <div className="space-y-4 mb-8">
            <h4 className="font-medium text-gray-900">Device status</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  {cameraPerm === 'granted' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-gray-900">Camera</span>
                </div>
                <span className={`text-sm ${cameraPerm === 'granted' ? 'text-green-600' : 'text-red-500'}`}>
                  {cameraPerm === 'granted' ? 'Ready' : 'Permission needed'}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  {micPerm === 'granted' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-gray-900">Microphone</span>
                </div>
                <span className={`text-sm ${micPerm === 'granted' ? 'text-green-600' : 'text-red-500'}`}>
                  {micPerm === 'granted' ? 'Ready' : 'Permission needed'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!appointmentStateLoaded ? (
              <div className="space-y-3">
                <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                {process.env.NODE_ENV === 'development' && (
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                )}
              </div>
            ) : (
              <>
                {appointmentState?.is_with_doctor && autoStartFailed ? (
                  <Button
                    type="button"
                    variant="default"
                    size="lg"
                    className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={onJoinCallDirect}
                    disabled={isJoining || telehealth.isBusy}
                  >
                    {isJoining || telehealth.isBusy ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Connecting...
                      </div>
                    ) : (
                      "Join meeting now"
                    )}
                  </Button>
                ) : !isDoctorReady ? (
                  <Button
                    type="button"
                    variant="default"
                    size="lg"
                    className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={onJoinWaitlist}
                    disabled={isJoining || telehealth.isBusy}
                  >
                    {isJoining || telehealth.isBusy ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Connecting...
                      </div>
                    ) : (
                      "Join waiting room"
                    )}
                  </Button>
                ) : null}
                
                {/* Development mode button */}
                {process.env.NODE_ENV === 'development' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full h-12 text-base font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={onJoinCallDirect}
                    disabled={isJoining || telehealth.isBusy}
                  >
                    Direct join (dev mode)
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Permission Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 text-center">
                If camera or microphone access is blocked, click the lock icon in your browser&apos;s address bar and enable permissions.
              </p>
            </div>
          </div>

        </div>
      </div>
    );
  };

  const WaitingRoom = () => {
    const doctorName = appointmentState?.doctor?.full_name;
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              Waiting for your provider
            </h1>
            <p className="text-gray-600">
              Your healthcare provider will join shortly
            </p>
          </div>

          {/* Doctor Info */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            {!appointmentStateLoaded ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-48"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {doctorName ? doctorName.split(' ').map(n => n[0]).join('').slice(0, 2) : 'P'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{doctorName ? `Dr. ${doctorName}` : 'Provider'}</h3>
                  <p className="text-sm text-gray-500">
                    Will join the session shortly
                  </p>
                </div>
                <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  Waiting
                </div>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {doctorConnected ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Your provider is ready!</p>
                  <p className="text-sm text-green-600">Starting session automatically...</p>
                </div>
                <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <p className="font-medium text-gray-900">Waiting for provider to connect...</p>
                  <p className="text-sm text-gray-600">Please stay on this page</p>
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 text-center">
                You&apos;ll be automatically connected when your provider joins the session.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
          <div className="flex-1 relative overflow-hidden bg-black sm:rounded-none lg:rounded-xl sm:shadow-lg h-full" data-video-panel>
            <TelehealthVideoPanel
              sessionTitle={sessionTitle}
              providerName={providerName}
              participants={telehealth.participants}
              localParticipantName="You"
              statusMessage={telehealth.statusMessage}
              onRemoteContainerReady={handleRemoteContainerReady}
              onLocalContainerReady={handleLocalContainerReady}
              signalStrength={telehealth.signalStrength}
              pendingPiPRequest={telehealth.pendingPiPRequest}
              isPictureInPicture={telehealth.isPictureInPicture}
              onTogglePictureInPicture={telehealth.togglePictureInPicture}
              onCurrentViewPiP={handleCurrentViewPiP}
              setPendingPiPRequest={telehealth.setPendingPiPRequest}
              onParticipantVideoReady={telehealth.onParticipantVideoReady}
              enablePiPFollowSpeaker={telehealth.enablePiPFollowSpeaker}
              pipFollowsSpeaker={telehealth.pipFollowsSpeaker}
              activeSpeakerId={telehealth.activeSpeakerId}
              participantAudioLevels={new Map()}
              getVideoElementById={telehealth.getVideoElementById}
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
                  onTogglePictureInPicture={() => {
                    
                    // Enable follow speaker mode
                    telehealth.enablePiPFollowSpeaker();
                    
                    // Find the best video element for PiP
                    let targetVideo = null;
                    
                    // First try to find active speaker's video
                    if (telehealth.activeSpeakerId) {
                      const speakerVideo = document.querySelector(`[data-connection-id="${telehealth.activeSpeakerId}"] video`) as HTMLVideoElement;
                      if (speakerVideo) {
                        targetVideo = speakerVideo;
                      }
                    }
                    
                    // Fallback to local video
                    if (!targetVideo) {
                      targetVideo = document.querySelector('#vonage-local-container video') as HTMLVideoElement;
                      if (targetVideo) {
                      }
                    }
                    
                    // Final fallback to any video
                    if (!targetVideo) {
                      targetVideo = document.querySelector('video') as HTMLVideoElement;
                      if (targetVideo) {
                      }
                    }
                    
                    if (targetVideo) {
                      try {
                        targetVideo.requestPictureInPicture();
                      } catch (err: unknown) {
                      }
                    } else {
                    }
                  }}
                  isPictureInPicture={telehealth.isPictureInPicture}
                  pendingPiPRequest={telehealth.pendingPiPRequest}
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
          <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800">
            <div className="flex flex-col gap-2 px-4 pt-2 pb-3">
              <div className="mx-auto h-1 w-12 rounded-full bg-white/20" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-base">Conversations</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${telehealth.isConnected ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <span className="text-xs text-gray-400">{telehealth.isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
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
              headerTitle="Conversations"
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
            isConnected={telehealth.isConnected}
            isOpen={isChatOpen}
            onToggle={() => setIsChatOpen(v => !v)}
            hideTrigger
            variant="drawer"
            headerTitle="Conversations"
            headerSubtitle={`${telehealth.participantCount} participants in room`}
            participantNames={telehealth.participantCount > 0 ? [...new Set(["You", providerName].filter(name => name && name.trim()))] : []}
          />
        </div>
      </div>

      <PermissionRequestModal isOpen={showPermissionModal} onClose={handlePermissionClose} onRetry={handlePermissionRetry} error={telehealth.error} />
    </div>
  );
}