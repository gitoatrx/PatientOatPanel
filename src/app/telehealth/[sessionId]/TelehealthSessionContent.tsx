"use client";

import React, { useCallback, useState } from "react";
import {
  TelehealthVideoPanel,
  TelehealthChatPanel,
  TelehealthCallControls,
  PermissionRequestModal,
  type TelehealthChatMessage,
} from "@/components/telehealth";
import { useVonageSession, type ChatMessage } from "@/lib/telehealth/useVonageSession";
import { X } from "lucide-react";

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

      return (
        <div className="h-screen bg-background overflow-hidden p-0 lg:p-8">
          {/* Split Screen Layout - Responsive */}
          <div className="flex flex-col lg:flex-row h-full gap-0 lg:gap-4">
            {/* Left Side - Video Panel */}
            <div className="flex-1 flex flex-col min-h-0 h-full">
              {/* Video Header */}
              {/* <div className="px-6 py-2">
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    {sessionTitle}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Meeting with {providerName}
                  </p>
                </div>
              </div> */}

              {/* Video Content */}
              <div className="flex-1 relative rounded-lg overflow-hidden h-full">
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
                    />
                  }
                />

                {/* Error Display */}
                {telehealth.error && !isPermissionError && (
                  <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4">
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 sm:px-4 sm:py-3 text-sm text-rose-700">
                      <div className="flex items-center justify-between">
                        <span>{telehealth.error}</span>
                        <button 
                          onClick={() => telehealth.clearError()}
                          className="text-rose-500 hover:text-rose-700 ml-2 p-1 rounded-full hover:bg-rose-100 transition-colors"
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

            {/* Right Side - Chat Panel */}
            <div className="w-full lg:w-96 h-80 lg:h-full bg-white border border-gray-200 flex flex-col rounded-lg">
              {/* Chat Header with Doctor Info */}
              <div className="p-3 sm:p-4">
                <div className="bg-primary rounded-xl p-3 sm:p-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <span className="text-primary-foreground font-bold text-sm sm:text-lg">
                        {providerName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-primary-foreground text-sm sm:text-lg truncate">{providerName}</h3>
                      <p className="text-xs sm:text-sm text-primary-foreground/80">Endocrinologist</p>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${telehealth.isConnected ? 'bg-green-400' : 'bg-muted-foreground'}`}></div>
                      <span className="text-xs text-primary-foreground/80 hidden sm:inline">
                        {telehealth.isConnected ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-hidden">
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
