"use client";

import React, { useCallback, useState } from "react";
import {
  TelehealthVideoPanel,
  TelehealthChatPanel,
  TelehealthCallControls,
  PermissionRequestModal,
  TelehealthChatLauncher,
  type TelehealthChatMessage,
} from "@/components/telehealth";
import { useVonageSession, CALL_STATUSES, type CallStatus, type ChatMessage } from "@/lib/telehealth/useVonageSession";

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

  // Convert Vonage chat messages to UI format
  const uiMessages: TelehealthChatMessage[] = telehealth.chatMessages.map(msg => ({
    id: msg.id,
    author: msg.author,
    authoredAt: msg.timestamp,
    content: msg.content,
    isOwn: msg.isOwn,
  }));

  // Status display logic (matching doctor-side implementation)
  const getStatusDisplay = (status: CallStatus, participantCount: number) => {
    switch (status) {
      case CALL_STATUSES.IDLE:
        return { label: "Ready to join", badgeClass: "bg-gray-500 text-white" };
      case CALL_STATUSES.LOADING:
        return { label: "Connecting", badgeClass: "bg-orange-500 text-white" };
      case CALL_STATUSES.CONNECTED:
        // Show "Connected" with green badge when other user is connected (participantCount > 1)
        if (participantCount > 1) {
          return { label: "Connected", badgeClass: "bg-green-500 text-white" };
        }
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

  const unreadCount = uiMessages.slice(lastReadIndex).filter(m => !m.isOwn).length;

  // Show permission modal when there's a permission error
  const isPermissionError = telehealth.error?.includes('camera and microphone') || 
                           telehealth.error?.includes('Permission') ||
                           telehealth.error?.includes('NotAllowedError');

  // Update modal state when permission error occurs
  React.useEffect(() => {
    if (isPermissionError) {
      setShowPermissionModal(true);
    }
  }, [isPermissionError]);

  const handlePermissionRetry = () => {
    setShowPermissionModal(false);
    // Clear the error first, then retry
    telehealth.clearError();
    setTimeout(() => {
      void telehealth.join();
    }, 100);
  };

  const handlePermissionClose = () => {
    setShowPermissionModal(false);
  };

  React.useEffect(() => {
    if (isChatOpen) {
      setLastReadIndex(uiMessages.length);
    }
  }, [isChatOpen, uiMessages.length]);

      return (
        <div className="telehealth-full-viewport bg-background overflow-hidden p-0 lg:p-6 pb-[var(--safe-area-bottom)] md:pb-0">
          {/* Split Screen Layout - Responsive */}
          <div className="flex flex-col lg:flex-row h-full gap-4 lg:gap-6">
            {/* Left Side - Video Panel */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Video Content */}
              <div className="flex-1 relative overflow-hidden bg-black sm:rounded-xl sm:shadow-lg">
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
                      isBusy={telehealth.isBusy}
                      isMicMuted={telehealth.isMicMuted}
                      isCameraOff={telehealth.isCameraOff}
                      onJoin={() => { void telehealth.join(); }}
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
                    />
                  }
                />

                {/* Error Display */}
                {telehealth.error && !isPermissionError && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{telehealth.error}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Chat Panel (desktop only) */}
            <div className="hidden lg:flex lg:w-96 lg:h-full bg-gray-50 flex-col rounded-xl shadow-lg overflow-hidden">
              {/* Discord-style Chat Header */}
              <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
                <div className="flex items-center gap-3">
                  {/* Provider Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {providerName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    {/* Online Status Indicator */}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800 ${
                      telehealth.isConnected ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                  </div>

                  {/* Provider Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm truncate">{providerName}</h3>
                    <p className="text-gray-400 text-xs">
                      {telehealth.isConnected ? 'Online' : 'Offline'} • Healthcare Provider
                    </p>
                  </div>

                  {/* Connection Status */}
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      telehealth.isConnected ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-xs text-gray-400">
                      {telehealth.isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
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
                participantNames={[...new Set(["You", providerName, ...telehealth.participants.map(p => `Participant ${p.connectionId.slice(-4)}`)])]}
              />
            </div>
          </div>

      {/* Permission Request Modal */}
      <PermissionRequestModal
        isOpen={showPermissionModal}
        onClose={handlePermissionClose}
        onRetry={handlePermissionRetry}
        error={telehealth.error}
      />
    </div>
  );
}
