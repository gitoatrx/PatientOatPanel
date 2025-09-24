# Telehealth (Vonage) Integration

This directory contains the client-side building blocks for our Vonage-powered telehealth experience. The implementation is used by `src/app/telehealth/[sessionId]/page.tsx`, which pulls everything together into a full session view with video, chat, and call controls.

## Prerequisites

1. **Vonage Video API credentials**
   - `TELEHEALTH_VONAGE_APPLICATION_ID` (or fallback `VONAGE_APPLICATION_ID`)
   - `TELEHEALTH_VONAGE_PRIVATE_KEY` (or `TELEHEALTH_VONAGE_PRIVATE_KEY_PATH` if you prefer to point at a `.pem` file)
2. **Telehealth session endpoint**
   - The patient link must resolve to `/clinic/appointments/{appointmentId}/video/session/patient?token=...` so the browser can fetch the Vonage session id and token.
3. Create a `finaldemo/rooms.json` file (the backend writes to it) or ensure the `finaldemo` directory is writable so room metadata can be cached between requests.

Set these variables in `.env.local` for client overrides and `.env` (or your host environment) for server-only secrets. Restart the dev server after changing env vars.

## High-level architecture

```
telehealth page (app/telehealth/[sessionId]/page.tsx)
+- TelehealthSessionContent (app/telehealth/[sessionId]/TelehealthSessionContent.tsx)
   +- TelehealthVideoPanel (components/telehealth/TelehealthVideoPanel.tsx)
   �   +- hooks with useVonageSession for remote/local containers
   +- TelehealthCallControls (components/telehealth/TelehealthCallControls.tsx)
   +- TelehealthChatLauncher & TelehealthChatPanel
   +- PermissionRequestModal (camera/mic guidance)
   +- TelehealthDebugPanel (error + retry during failures)
```

Session credentials are issued by the clinic API via `/clinic/appointments/{appointmentId}/video/session/patient?token=...`. The hook uses the follow-up token embedded in the URL to request the Vonage session id and token, while the Vonage application id is provided by the frontend. The demo Express service in `finaldemo/index.js` remains available for local end-to-end testing.

## Session lifecycle

`useVonageSession` (`src/lib/telehealth/useVonageSession.ts`) provides the orchestration layer that the page relies on. The hook exposes:

- `join()` � Fetch a Vonage token, initialize the SDK, and publish the local camera/microphone stream. Permission preflight runs before any network call so the UI can surface browser permission issues quickly.
- `leave()` � Disconnect and dispose of publisher/session resources.
- `toggleMic()`, `toggleCamera()`, `switchCamera()` � Update the active publisher without reloading the page.
- `isConnected`, `isBusy`, `isMicMuted`, `isCameraOff`, `statusMessage`, `error` � State that powers the UI overlays.

### Remote media handling

The hook wires the remote and local container refs that `TelehealthVideoPanel` passes in. When `streamCreated` fires we:

1. Ignore our own stream (Vonage emits it for the publisher as well).
2. Tag each remote wrapper with `data-connection-id` + `data-stream-type` so multiple camera restarts from the same connection replace the existing tile instead of duplicating it.
3. Subscribe the viewer element to the stream and normalize styling (`normalizeVideoElements`).
4. Clean up wrappers on `streamDestroyed` and revert the status message when no remote streams are present.

### Error handling

All errors flow into `error` and `statusMessage` for display. We differentiate between:

- Permission denials (keeps the permission modal open).
- Network/token issues (offer retry via `TelehealthDebugPanel`).
- Session disconnects (trigger cleanup and reset state).

## UI entry point

For a custom page you can compose the pieces similarly to `TelehealthSessionContent`:

```tsx
const telehealth = useVonageSession({
  appointmentId,
  followupToken,
  participantName: patientName,
  remoteContainer,
  localContainer,
});

return (
  <TelehealthVideoPanel
    sessionTitle={sessionTitle}
    providerName={providerName}
    participants={participants}
    onRemoteContainerReady={setRemoteContainer}
    onLocalContainerReady={setLocalContainer}
    overlayControls={
      <TelehealthCallControls
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
);
```

Additional modules such as `TelehealthChatLauncher`, `TelehealthChatPanel`, and `TelehealthDebugPanel` are exported from `src/components/telehealth/index.ts` for easier reuse.

## Local development checklist

- Start the Next.js dev server: `npm run dev`
- Navigate to `/telehealth/demo-room` (any `sessionId` works; a new Vonage session is created if necessary).
- Click **Join call** and allow camera/mic permissions when prompted.
- Open the same room in a second browser/profile to simulate the clinician.

## Troubleshooting

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| "Telehealth video is not configured" from the backend | Missing Vonage credentials | Ensure `TELEHEALTH_VONAGE_APPLICATION_ID` and `TELEHEALTH_VONAGE_PRIVATE_KEY` are set in your backend environment. |
| Permission modal keeps reopening | Browser denied camera/mic | Grant access in the browser UI, then hit **Retry** in the modal. |
| Duplicate remote tiles | Same connection reconnecting without cleanup | Handled in `handleStreamCreated`; ensure the latest code is deployed. |
| `rooms.json` write failures | Missing `finaldemo` directory or insufficient permissions | Create `finaldemo/rooms.json` manually or adjust filesystem permissions. |
| `Failed to fetch` during join | CORS/network issue with patient session endpoint | Verify the `/clinic/appointments/{appointmentId}/video/session/patient` endpoint and network reachability. |

## Extending the flow

- Add analytics by watching the status flags from `useVonageSession`.
- Customize chat by replacing `TelehealthChatPanel` with your own component; reuse the `TelehealthChatMessage` type for consistency.
- Hook up real participant metadata by replacing the `participants` prop passed into `TelehealthVideoPanel`.

For deeper API details, see the inline comments in `useVonageSession.ts` and the Vonage Video API docs: https://developer.vonage.com/en/video/building-blocks.
