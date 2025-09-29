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
import { AblyVideoCallService, type AblyConnectEvent } from "@/lib/services/ablyVideoCallService";
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
  providerName,
  sessionTitle,
  participants,
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
  const [pendingPiPRequest, setPendingPiPRequest] = useState(false);
  const [pipPreferenceEnabled, setPipPreferenceEnabled] = useState(false);
  const [pipFollowsSpeaker, setPipFollowsSpeaker] = useState(false);
  
  // PiP Follow Speaker refs and state
  const participantVideosRef = React.useRef(new Map<string, HTMLVideoElement>());
  const pipCarrierVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const pipCarrierStreamRef = React.useRef<MediaStream | null>(null);
  
  // Active speaker detection
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [participantAudioLevels, setParticipantAudioLevels] = useState(new Map<string, number>());
  const audioLevelCheckIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  
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
  }, [isJoining, telehealth]);

  // Helper function to find the best video element for PiP
  const findBestVideoElementForPiP = useCallback(() => {
    const candidates: HTMLVideoElement[] = [];
    if (remoteContainer) candidates.push(...Array.from(remoteContainer.querySelectorAll('video')) as HTMLVideoElement[]);
    if (localContainer) candidates.push(...Array.from(localContainer.querySelectorAll('video')) as HTMLVideoElement[]);
    candidates.push(...Array.from(document.querySelectorAll('[data-video-panel] video')) as HTMLVideoElement[]);
    candidates.push(...Array.from(document.querySelectorAll('video')) as HTMLVideoElement[]);

    return candidates.find(v =>
      typeof (v as any).requestPictureInPicture === 'function' &&
      v.readyState >= 2 &&
      // @ts-ignore
      !v.disablePictureInPicture
    ) || null;
  }, [remoteContainer, localContainer]);

  // Picture-in-Picture toggle handler (pure click handler)
  const handleTogglePictureInPicture = useCallback(async () => {
    const video = findBestVideoElementForPiP();
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPictureInPicture(false);
        setPipFollowsSpeaker(false);
        
        // If user manually exits PiP, they might want to disable auto-trigger
        // We'll keep the preference enabled but log this action
        console.log('🎬 User manually exited PiP - preference remains enabled for future auto-trigger');
        return;
      }

      // Ensure it's playing (some browsers require this)
      if (video.paused) { try { await video.play(); } catch {} }

      if (document.pictureInPictureEnabled && video.requestPictureInPicture) {
        await video.requestPictureInPicture();
        setIsPictureInPicture(true);
        setPendingPiPRequest(false);
        
        // Remember user preference for future auto-activation
        setPipPreferenceEnabled(true);
        localStorage.setItem('pip-preference-enabled', 'true');
        console.log('🎬 PiP preference enabled - will auto-trigger on future tab switches');
        return;
      }

      // Safari fallback
      // @ts-ignore
      if (video.webkitSupportsPresentationMode && typeof video.webkitSetPresentationMode === 'function') {
        // @ts-ignore
        video.webkitSetPresentationMode('picture-in-picture');
        setIsPictureInPicture(true);
        setPendingPiPRequest(false);
        
        // Remember user preference for future auto-activation
        setPipPreferenceEnabled(true);
        localStorage.setItem('pip-preference-enabled', 'true');
        console.log('🎬 PiP preference enabled (Safari) - will auto-trigger on future tab switches');
      }
    } catch (err) {
      console.warn('PiP toggle failed:', err);
    }
  }, [findBestVideoElementForPiP]);

  // Register participant videos for speaker following
  const handleParticipantVideoReady = useCallback((id: string, el: HTMLVideoElement | null) => {
    const map = participantVideosRef.current;
    if (el) {
      map.set(id, el);
      console.log('🎬 Registered participant video:', id);
    } else {
      map.delete(id);
      console.log('🎬 Unregistered participant video:', id);
    }
  }, []);

  // Utility: get a video track for a participant
  const getParticipantVideoTrack = useCallback((participantId: string): MediaStreamTrack | null => {
    const v = participantVideosRef.current.get(participantId);
    const stream = (v?.srcObject as MediaStream) || null;
    if (!stream) return null;
    const track = stream.getVideoTracks()[0] || null;
    return track;
  }, []);

  // Utility: get audio level for a participant
  const getParticipantAudioLevel = useCallback((participantId: string): number => {
    const video = participantVideosRef.current.get(participantId);
    if (!video) return 0;

    // Try to get audio level from the video element
    // @ts-ignore - webkitAudioDecodedByteCount is a WebKit-specific property
    if (video.webkitAudioDecodedByteCount !== undefined) {
      // @ts-ignore
      return Math.min(video.webkitAudioDecodedByteCount / 1000000, 1); // Normalize to 0-1
    }

    // Fallback: check if audio is playing and estimate level
    // @ts-ignore - audioTracks is a non-standard property
    if (video.audioTracks && video.audioTracks.length > 0) {
      // @ts-ignore - mozHasAudio is a Firefox-specific property
      return video.mozHasAudio ? 0.5 : 0;
    }

    // If we have audio tracks in the stream, assume some level
    const stream = video.srcObject as MediaStream;
    if (stream && stream.getAudioTracks().length > 0) {
      return 0.3; // Default moderate level
    }

    return 0;
  }, []);

  // Active speaker detection logic
  const detectActiveSpeaker = useCallback(() => {
    const levels = new Map<string, number>();
    let maxLevel = 0;
    let activeSpeaker: string | null = null;

    // Check audio levels for all participants
    telehealth.participants.forEach(participant => {
      if (!participant.isLocal) {
        const level = getParticipantAudioLevel(participant.connectionId);
        levels.set(participant.connectionId, level);
        
        if (level > maxLevel && level > 0.1) { // Threshold to avoid noise
          maxLevel = level;
          activeSpeaker = participant.connectionId;
        }
      }
    });

    setParticipantAudioLevels(levels);

    // Only update active speaker if there's a significant change
    if (activeSpeaker !== activeSpeakerId) {
      setActiveSpeakerId(activeSpeaker);
      console.log('🎤 Active speaker changed:', { 
        from: activeSpeakerId, 
        to: activeSpeaker, 
        level: maxLevel 
      });
    }
  }, [telehealth.participants, getParticipantAudioLevel, activeSpeakerId]);

  // Start/stop audio level monitoring
  const startAudioLevelMonitoring = useCallback(() => {
    if (audioLevelCheckIntervalRef.current) return; // Already running

    console.log('🎤 Starting audio level monitoring for active speaker detection');
    audioLevelCheckIntervalRef.current = setInterval(detectActiveSpeaker, 500); // Check every 500ms
  }, [detectActiveSpeaker]);

  const stopAudioLevelMonitoring = useCallback(() => {
    if (audioLevelCheckIntervalRef.current) {
      clearInterval(audioLevelCheckIntervalRef.current);
      audioLevelCheckIntervalRef.current = null;
      console.log('🎤 Stopped audio level monitoring');
    }
  }, []);

  // Create the carrier video element just-in-time
  const ensureCarrier = useCallback((): HTMLVideoElement => {
    if (pipCarrierVideoRef.current) return pipCarrierVideoRef.current;

    const el = document.createElement('video');
    el.style.display = 'none';
    el.playsInline = true;
    el.muted = true; // avoid echo
    // @ts-ignore experimental attr is harmless
    el.setAttribute('autopictureinpicture', '');
    document.body.appendChild(el);

    pipCarrierVideoRef.current = el;
    console.log('🎬 Created carrier video element for PiP');
    return el;
  }, []);

  // Put the current speaker in the carrier stream
  const setCarrierToParticipant = useCallback(async (participantId: string): Promise<boolean> => {
    const track = getParticipantVideoTrack(participantId);
    if (!track) {
      console.warn('🎬 No video track found for participant:', participantId);
      return false;
    }

    let stream = pipCarrierStreamRef.current;
    const carrier = ensureCarrier();

    if (!stream) {
      stream = new MediaStream();
      pipCarrierStreamRef.current = stream;
      carrier.srcObject = stream;
    }

    // Replace existing track with the new one
    const existing = stream.getVideoTracks()[0];
    if (existing && existing.id !== track.id) {
      stream.removeTrack(existing);
      existing.stop(); // optional
    }
    if (!existing || existing.id !== track.id) {
      stream.addTrack(track);
    }

    // Make sure it's playing
    try { 
      if (carrier.paused) await carrier.play(); 
    } catch (e) {
      console.warn('🎬 Failed to play carrier video:', e);
    }

    console.log('🎬 Set carrier to participant:', participantId);
    return true;
  }, [getParticipantVideoTrack, ensureCarrier]);

  // One-click: Enable PiP (Follow Speaker)
  const enablePiPFollowSpeaker = useCallback(async () => {
    // Start audio level monitoring for active speaker detection
    startAudioLevelMonitoring();
    
    // Get the active speaker ID - use detected active speaker or fallback to first remote participant
    let activeId = activeSpeakerId;
    
    if (!activeId) {
      // Fallback: use the first remote participant
      activeId = telehealth.participants.find(p => !p.isLocal)?.connectionId || null;
      console.log('🎬 No active speaker detected, using first remote participant:', activeId);
    } else {
      console.log('🎬 Using detected active speaker for PiP:', activeId);
    }
    
    if (!activeId) {
      console.warn('🎬 No participants found for PiP follow');
      return;
    }

    const ok = await setCarrierToParticipant(activeId);
    if (!ok) {
      console.warn('🎬 Failed to set carrier to participant');
      return;
    }

    const carrier = ensureCarrier();

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      }

      if (document.pictureInPictureEnabled && carrier.requestPictureInPicture) {
        await carrier.requestPictureInPicture();
      } else {
        // Safari fallback
        // @ts-ignore
        if (carrier.webkitSupportsPresentationMode && typeof carrier.webkitSetPresentationMode === 'function') {
          // @ts-ignore
          carrier.webkitSetPresentationMode('picture-in-picture');
        }
      }
      
      setPipFollowsSpeaker(true);
      setPendingPiPRequest(false);
      setIsPictureInPicture(true);
      
      // Remember user preference for future auto-activation
      setPipPreferenceEnabled(true);
      localStorage.setItem('pip-preference-enabled', 'true');
      console.log('🎬 PiP follow speaker enabled - will auto-trigger on future tab switches');
    } catch (e) {
      console.warn('🎬 Enable PiP follow speaker failed:', e);
    }
  }, [telehealth.participants, activeSpeakerId, setCarrierToParticipant, ensureCarrier, startAudioLevelMonitoring]);

  // Auto-trigger PiP when user has enabled preference
  const autoTriggerPiP = useCallback(async () => {
    if (!pipPreferenceEnabled || isPictureInPicture) return;
    
    const video = findBestVideoElementForPiP();
    if (!video) return;

    try {
      console.log('🎬 Auto-triggering PiP based on user preference');
      
      // Ensure it's playing (some browsers require this)
      if (video.paused) { try { await video.play(); } catch {} }

      if (document.pictureInPictureEnabled && video.requestPictureInPicture) {
        await video.requestPictureInPicture();
        console.log('✅ Auto PiP triggered successfully');
        return;
      }

      // Safari fallback
      // @ts-ignore
      if (video.webkitSupportsPresentationMode && typeof video.webkitSetPresentationMode === 'function') {
        // @ts-ignore
        video.webkitSetPresentationMode('picture-in-picture');
        console.log('✅ Auto PiP triggered successfully (Safari)');
      }
    } catch (err) {
      console.warn('Auto PiP trigger failed:', err);
    }
  }, [pipPreferenceEnabled, isPictureInPicture, findBestVideoElementForPiP]);

  // Listen for PiP events on the video element
  useEffect(() => {
    const video = findBestVideoElementForPiP();
    if (!video) return;

    const onEnter = () => setIsPictureInPicture(true);
    const onLeave = () => setIsPictureInPicture(false);

    video.addEventListener('enterpictureinpicture', onEnter as any);
    video.addEventListener('leavepictureinpicture', onLeave as any);

    return () => {
      video.removeEventListener('enterpictureinpicture', onEnter as any);
      video.removeEventListener('leavepictureinpicture', onLeave as any);
    };
  }, [findBestVideoElementForPiP]);

  // Progressive Auto-PiP (Chromium) + Media Session handler
  useEffect(() => {
    if (!telehealth.isConnected) return;
    const video = findBestVideoElementForPiP();
    if (!video) return;

    // Media Session metadata (nice-to-have)
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: sessionTitle || 'Telehealth Session',
          artist: providerName || 'Healthcare Provider',
          album: 'Video Call',
        });
      } catch {}
    }

    // Handle "enterpictureinpicture" from system media controls (user-driven)
    try {
      // @ts-ignore
      navigator.mediaSession?.setActionHandler?.('enterpictureinpicture', async () => {
        if (!document.pictureInPictureElement && video?.requestPictureInPicture) {
          try {
            if (video.paused) { try { await video.play(); } catch {} }
            await video.requestPictureInPicture();
          } catch (e) { console.warn('MediaSession PiP failed', e); }
        }
      });
    } catch {}

    // Experimental Auto-PiP (Chromium desktop). Harmless no-op elsewhere.
    try {
      // @ts-ignore
      if ('autoPictureInPicture' in HTMLVideoElement.prototype) {
        // @ts-ignore
        video.autoPictureInPicture = true; // allow Chrome to auto-pop PiP on tab/app switch.
      }
      // Also set the HTML attribute for better compatibility
      video.setAttribute('autopictureinpicture', '');
    } catch {}
  }, [telehealth.isConnected, findBestVideoElementForPiP, providerName, sessionTitle]);

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

  // Cleanup Ably service and audio monitoring on unmount
  useEffect(() => {
    return () => {
      if (ablyService) {
        ablyService.disconnect();
      }
      // Stop audio level monitoring
      stopAudioLevelMonitoring();
    };
  }, [ablyService, stopAudioLevelMonitoring]);

  // On tab switch / app blur: auto-trigger PiP if preference enabled, otherwise show nudge
  useEffect(() => {
    const handleTabSwitch = async () => {
      if (!telehealth.isConnected || document.pictureInPictureElement) return;
      
      if (pipPreferenceEnabled) {
        // User has enabled PiP preference - auto-trigger
        console.log('🎬 Tab switch detected - auto-triggering PiP based on user preference');
        await autoTriggerPiP();
              } else {
        // User hasn't enabled PiP preference yet - show nudge
        console.log('🎬 Tab switch detected - showing PiP nudge');
        setPendingPiPRequest(true);
      }
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
  }, [telehealth.isConnected, pipPreferenceEnabled, autoTriggerPiP]);

  // Switch inside PiP when speaker changes (throttled)
  useEffect(() => {
    if (!pipFollowsSpeaker || !activeSpeakerId) return;
    
    // Only update if our carrier is actually the one in PiP
    const isCarrierInPiP = document.pictureInPictureElement === pipCarrierVideoRef.current;
    if (!isCarrierInPiP) return;

    // Throttle switching to avoid strobe effect
    const SWITCH_THROTTLE_MS = 1200;
    let lastSwitchAt = 0;
    
      const now = Date.now();
    if (now - lastSwitchAt < SWITCH_THROTTLE_MS) return;
    lastSwitchAt = now;

    console.log('🎤 Switching PiP to active speaker:', activeSpeakerId);
    (async () => {
      await setCarrierToParticipant(activeSpeakerId);
    })();
  }, [activeSpeakerId, pipFollowsSpeaker, setCarrierToParticipant]);

  // Clean up on PiP exit / call end
  useEffect(() => {
    const onLeave = () => {
      setIsPictureInPicture(false);
      setPipFollowsSpeaker(false);
      // Stop carrier track
      const s = pipCarrierStreamRef.current;
      s?.getTracks().forEach(t => t.stop());
      // Stop audio level monitoring
      stopAudioLevelMonitoring();
      console.log('🎬 PiP exited - cleaned up carrier stream and audio monitoring');
    };

    const carrier = pipCarrierVideoRef.current;
    if (!carrier) return;

    // Events fire on the video element
    carrier.addEventListener('leavepictureinpicture', onLeave as any);
    return () => {
      carrier.removeEventListener('leavepictureinpicture', onLeave as any);
    };
  }, [stopAudioLevelMonitoring]);

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
        console.log('🎬 Restored PiP preference from localStorage - will auto-trigger on tab switches');
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
      
      // Note: PiP permission will be requested after session starts
      
      // 2. Mark patient as waiting in the waiting room via API
      console.log('🚪 Joining waitlist - marking patient as waiting...');
      await waitingRoomService.markPatientAsWaiting(followupToken);
      console.log('✅ Patient successfully marked as waiting');
      
      // 3. Start listening for doctor connect events via Ably
      console.log('🎧 Starting Ably listener for doctor connect events...');
      const newAblyService = new AblyVideoCallService({
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
      
      await newAblyService.connect();
      setAblyService(newAblyService);
      
      // 4. Enter waiting room state
      setIsInWaitingRoom(true);
      setShowPreJoin(false);
      
    } catch (error) {
      console.error('❌ Failed to join waitlist:', error);
      if (error instanceof Error && error.message.includes('Permission denied')) {
          setShowPermissionModal(true);
      } else {
        // Handle API errors or other issues
        console.error('❌ Error joining waitlist:', error);
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
      
      // Note: PiP permission will be requested after session starts
      
      // Skip waiting room and API calls - go directly to session
      setShowPreJoin(false);
      setPendingJoin(true);
      setIsInWaitingRoom(false);
      setDoctorConnected(false);
      
      console.log('✅ [DEV] Direct join initiated');
      
    } catch (error) {
      console.error('❌ [DEV] Failed to join call directly:', error);
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
            You&apos;re now in the waiting room. We&apos;ll notify you when your provider is ready to start the session.
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
              pendingPiPRequest={pendingPiPRequest}
              isPictureInPicture={isPictureInPicture}
              onTogglePictureInPicture={handleTogglePictureInPicture}
              setPendingPiPRequest={setPendingPiPRequest}
              onParticipantVideoReady={handleParticipantVideoReady}
              enablePiPFollowSpeaker={enablePiPFollowSpeaker}
              pipFollowsSpeaker={pipFollowsSpeaker}
              activeSpeakerId={activeSpeakerId}
              participantAudioLevels={participantAudioLevels}
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
                  pendingPiPRequest={pendingPiPRequest}
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
            participantNames={telehealth.participantCount > 0 ? [...new Set(["You", providerName, ...telehealth.participants.slice(0, Math.max(0, telehealth.participantCount - 2)).map(p => `Participant ${p.connectionId.slice(-4)}`)])] : []}
          />
        </div>
      </div>

      <PermissionRequestModal isOpen={showPermissionModal} onClose={handlePermissionClose} onRetry={handlePermissionRetry} error={telehealth.error} />
    </div>
  );
}