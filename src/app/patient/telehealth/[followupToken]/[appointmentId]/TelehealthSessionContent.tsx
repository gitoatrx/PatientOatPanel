"use client";

import React, { useCallback, useState } from "react";
import {
  TelehealthVideoPanel,
  TelehealthChatPanel,
  TelehealthCallControls,
  PermissionRequestModal,
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
        <div className="h-screen bg-gray-50 overflow-hidden p-4 lg:p-6">
          {/* Split Screen Layout - Responsive */}
          <div className="flex flex-col lg:flex-row h-full gap-4 lg:gap-6">
            {/* Left Side - Video Panel */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Video Content */}
              <div className="flex-1 relative rounded-xl overflow-hidden shadow-lg bg-white">
                <TelehealthVideoPanel
                  sessionTitle={sessionTitle}
                  providerName={providerName}
                  participants={participants}
                  localParticipantName="You"
                  statusMessage={telehealth.statusMessage}
                  onRemoteContainerReady={handleRemoteContainerReady}
                  onLocalContainerReady={handleLocalContainerReady}
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

            {/* Right Side - Chat Panel */}
            <div className="w-full lg:w-96 h-80 lg:h-full bg-gray-50 flex flex-col rounded-xl shadow-lg overflow-hidden">
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

              {/* Debug Controls - Commented Out for Production */}
              {/* 
              {telehealth.isConnected && (
                <div className="px-4 pb-2">
                  <div className="bg-gray-100 rounded-lg p-2 flex items-center space-x-1">
                    <span className="text-xs text-gray-600 mr-2">Debug:</span>
                    <button
                      onClick={telehealth.printParticipants}
                      className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-colors"
                      title="Print participants to console"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                      </svg>
                    </button>
                    <button
                      onClick={telehealth.checkExistingStreams}
                      className="p-1.5 bg-green-100 hover:bg-green-200 text-green-600 rounded transition-colors"
                      title="Check existing streams"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={telehealth.debugPublisherState}
                      className="p-1.5 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded transition-colors"
                      title="Debug publisher state"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={telehealth.debugSessionConnections}
                      className="p-1.5 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded transition-colors"
                      title="Debug session connections"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                    <button
                      onClick={telehealth.startCameraPreview}
                      className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors"
                      title="Start camera preview"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              */}

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

