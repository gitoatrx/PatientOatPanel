# Audio Waveform Implementation Guide

## For Doctor Side & Clinic Side Developers

This guide provides step-by-step instructions for implementing real-time audio waveform visualization in your telehealth interface. The feature displays animated vertical bars that respond to audio frequency, showing which participants are speaking during audio-only calls.

---

## Prerequisites

- React/Next.js project (or similar framework)
- Web Audio API support in target browsers
- Access to audio streams from your video conferencing solution (Vonage, WebRTC, etc.)

---

## Step 1: Create the Waveform Function

Create a new file or add to your existing video panel component:

```typescript
// Color palette for different participants
const PARTICIPANT_COLORS = [
  '#fbbf24', // yellow-400
  '#60a5fa', // blue-400
  '#34d399', // emerald-400
  '#f87171', // red-400
  '#a78bfa', // violet-400
  '#fb7185', // rose-400
  '#4ade80', // green-400
  '#f59e0b', // amber-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
];

// Get color for participant based on connectionId
const getParticipantColor = (connectionId: string, participantIndex: number = 0): string => {
  if (connectionId && connectionId !== 'local') {
    let hash = 0;
    for (let i = 0; i < connectionId.length; i++) {
      hash = connectionId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % PARTICIPANT_COLORS.length;
    return PARTICIPANT_COLORS[index];
  }
  return PARTICIPANT_COLORS[participantIndex % PARTICIPANT_COLORS.length];
};

// Add waveform visualization to a participant tile
const addWaveformToTile = (
  wrapper: HTMLElement, 
  video: HTMLVideoElement, 
  isLocal: boolean, 
  connectionId?: string, 
  participantIndex: number = 0
) => {
  // Check if waveform already exists
  if (wrapper.querySelector('.audio-waveform-container')) {
    return;
  }

  // Create waveform container
  const waveformContainer = document.createElement('div');
  waveformContainer.className = 'audio-waveform-container';
  waveformContainer.style.position = 'absolute';
  waveformContainer.style.left = '50%';
  waveformContainer.style.top = '50%';
  waveformContainer.style.transform = 'translate(0, -50%)';
  waveformContainer.style.width = 'calc(100% - 100px)';
  waveformContainer.style.maxWidth = '400px';
  waveformContainer.style.height = '80px';
  waveformContainer.style.zIndex = '15';
  waveformContainer.style.pointerEvents = 'none';

  // Get unique color for this participant
  const color = getParticipantColor(connectionId || '', participantIndex);
  const barCount = 25;

  // Create vertical bars container
  const barsContainer = document.createElement('div');
  barsContainer.className = 'waveform-bars-container';
  barsContainer.style.display = 'flex';
  barsContainer.style.alignItems = 'center';
  barsContainer.style.justifyContent = 'center';
  barsContainer.style.gap = '3px';
  barsContainer.style.height = '100%';
  barsContainer.style.width = '100%';

  // Create bars that extend both up and down
  const bars: HTMLElement[] = [];
  for (let i = 0; i < barCount; i++) {
    const barWrapper = document.createElement('div');
    barWrapper.style.position = 'relative';
    barWrapper.style.width = '4px';
    barWrapper.style.height = '100%';
    barWrapper.style.display = 'flex';
    barWrapper.style.flexDirection = 'column';
    barWrapper.style.alignItems = 'center';
    barWrapper.style.justifyContent = 'center';

    // Top bar (extends upward)
    const topBar = document.createElement('div');
    topBar.className = 'waveform-bar-top';
    topBar.style.width = '100%';
    topBar.style.height = '10%';
    topBar.style.minHeight = '2px';
    topBar.style.maxHeight = '50%';
    topBar.style.backgroundColor = color;
    topBar.style.borderRadius = '2px';
    topBar.style.transition = 'height 100ms ease-out';

    // Bottom bar (extends downward)
    const bottomBar = document.createElement('div');
    bottomBar.className = 'waveform-bar-bottom';
    bottomBar.style.width = '100%';
    bottomBar.style.height = '10%';
    bottomBar.style.minHeight = '2px';
    bottomBar.style.maxHeight = '50%';
    bottomBar.style.backgroundColor = color;
    bottomBar.style.borderRadius = '2px';
    bottomBar.style.transition = 'height 100ms ease-out';
    bottomBar.style.marginTop = '2px';

    barWrapper.appendChild(topBar);
    barWrapper.appendChild(bottomBar);
    barsContainer.appendChild(barWrapper);
    bars.push(barWrapper);
  }

  waveformContainer.appendChild(barsContainer);
  wrapper.appendChild(waveformContainer);

  // Set up audio analysis if video has audio stream
  if (video.srcObject instanceof MediaStream) {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(video.srcObject);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let animationFrameId: number;

      const updateWaveform = () => {
        if (!wrapper.parentElement) {
          // Container removed, cleanup
          try {
            source.disconnect();
            audioContext.close();
          } catch (e) {
            // Ignore cleanup errors
          }
          return;
        }

        analyser.getByteFrequencyData(dataArray);

        // Update each bar based on frequency data
        bars.forEach((barWrapper, index) => {
          const topBar = barWrapper.querySelector('.waveform-bar-top') as HTMLElement;
          const bottomBar = barWrapper.querySelector('.waveform-bar-bottom') as HTMLElement;
          
          if (!topBar || !bottomBar) return;

          // Map bar index to frequency bin
          const freqIndex = Math.floor((index / barCount) * bufferLength);
          const freqValue = dataArray[Math.min(freqIndex, bufferLength - 1)];
          
          // Normalize and calculate height (0-50% for each bar, so total 0-100%)
          const normalized = freqValue / 255;
          const amplified = Math.pow(normalized, 0.6);
          const heightPercent = Math.max(10, amplified * 50); // 10% to 50% for each side
          
          topBar.style.height = `${heightPercent}%`;
          bottomBar.style.height = `${heightPercent}%`;
        });

        animationFrameId = requestAnimationFrame(updateWaveform);
      };

      updateWaveform();
    } catch (error) {
      console.error('Error setting up waveform:', error);
    }
  }
};
```

---

## Step 2: Integrate into Your Video Panel Component

In your video panel component (where you render participant tiles), add the waveform when in audio mode:

```typescript
// In your normalizeVideoElements or similar function
const normalizeVideoElements = (
  container: HTMLDivElement | null,
  opts?: { 
    isAudioMode?: boolean;
    // ... other options
  }
) => {
  if (!container) return;
  
  const videos = container.querySelectorAll("video");
  videos.forEach((video, index) => {
    const wrapper = video.parentElement as HTMLElement | null;
    if (!wrapper) return;

    // ... your existing tile setup code ...

    // Add waveform visualization in audio mode
    if (opts?.isAudioMode) {
      const isLocal = /* determine if this is local participant */;
      const connectionId = wrapper.dataset.connectionId || 
                          wrapper.getAttribute('data-connection-id') || 
                          '';
      addWaveformToTile(wrapper, video, isLocal, connectionId, index);
    }
  });
};
```

---

## Step 3: Call the Function in Audio Mode

When rendering your video panel, pass `isAudioMode: true` when the call is in audio-only mode:

```typescript
// In your component render or effect
useEffect(() => {
  const remoteContainer = document.getElementById('your-remote-container-id');
  if (remoteContainer && callMode === 'audio') {
    normalizeVideoElements(remoteContainer, { 
      isAudioMode: true,
      // ... other options
    });
  }
}, [callMode, participants]);
```

---

## Step 4: Ensure Audio Streams Are Available

Make sure your video elements have audio streams attached:

```typescript
// Example: When subscribing to a remote stream
const videoElement = container.querySelector('video');
if (videoElement && videoElement.srcObject instanceof MediaStream) {
  // Stream is available - waveform will work
  // Make sure the stream has audio tracks
  const audioTracks = (videoElement.srcObject as MediaStream).getAudioTracks();
  if (audioTracks.length > 0) {
    // Audio is available
  }
}
```

---

## Configuration Options

### Adjust Bar Count

Change the number of bars by modifying `barCount`:

```typescript
const barCount = 25; // Increase for more bars, decrease for fewer
```

### Adjust Colors

Modify the `PARTICIPANT_COLORS` array to use your brand colors:

```typescript
const PARTICIPANT_COLORS = [
  '#your-color-1',
  '#your-color-2',
  // ... add more colors
];
```

### Adjust Size and Position

Modify the waveform container styles:

```typescript
waveformContainer.style.width = 'calc(100% - 100px)'; // Adjust width
waveformContainer.style.height = '80px'; // Adjust height
waveformContainer.style.left = '50%'; // Adjust horizontal position
```

### Adjust Animation Speed

Modify the transition duration:

```typescript
topBar.style.transition = 'height 100ms ease-out'; // Faster: 50ms, Slower: 150ms
```

---

## Key Points for Implementation

### 1. Audio Stream Access

- Ensure video elements have `srcObject` set to a `MediaStream`
- The stream must have audio tracks enabled
- Streams should be available when participants join

### 2. Connection ID Matching

- Use `data-connection-id` attributes on wrapper elements to match participants
- Or pass connectionId directly when calling `addWaveformToTile`
- This ensures consistent color assignment

### 3. Cleanup

- The function automatically cleans up when containers are removed
- Audio contexts are closed to prevent memory leaks
- No manual cleanup required

### 4. Performance

- Uses `requestAnimationFrame` for smooth 60fps updates
- Only updates bar heights, not entire DOM
- Efficient frequency data processing

---

## Testing Checklist

- [ ] Waveforms appear when `callMode === 'audio'`
- [ ] Each participant has a different color
- [ ] Bars animate when participants speak
- [ ] Bars are visible and properly positioned
- [ ] No console errors
- [ ] Works on different screen sizes
- [ ] Cleanup works when participants leave

---

## Troubleshooting

### Waveforms Don't Appear

1. **Check Audio Mode**: Verify `isAudioMode: true` is passed
2. **Check Streams**: Ensure video elements have audio streams
3. **Check Permissions**: Microphone permissions must be granted
4. **Check Browser**: Verify Web Audio API support

### Bars Don't Animate

1. **Check Audio Tracks**: Verify streams have active audio tracks
2. **Check Console**: Look for Web Audio API errors
3. **Check Frequency Data**: Verify `getByteFrequencyData` is working

### Performance Issues

1. **Reduce Bar Count**: Lower from 25 to 15-18
2. **Increase Smoothing**: Set `smoothingTimeConstant` to 0.9
3. **Check Audio Contexts**: Ensure only one context per stream

---

## Example Integration

Here's a complete example of how to integrate:

```typescript
// In your video panel component
useEffect(() => {
  if (callMode !== 'audio') return;

  const remoteContainer = document.getElementById('remote-video-container');
  if (!remoteContainer) return;

  const videos = remoteContainer.querySelectorAll('video');
  videos.forEach((video, index) => {
    const wrapper = video.parentElement as HTMLElement;
    if (!wrapper) return;

    const connectionId = wrapper.dataset.connectionId || '';
    const isLocal = wrapper.id === 'local-container';
    
    // Add waveform
    addWaveformToTile(wrapper, video as HTMLVideoElement, isLocal, connectionId, index);
  });
}, [callMode, participants]);
```

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify Web Audio API is supported
3. Ensure audio streams are properly connected
4. Check that `callMode === 'audio'` is set correctly

---

## Summary

This implementation provides:
- ✅ Real-time audio visualization
- ✅ Unique colors per participant
- ✅ No external dependencies
- ✅ Smooth animations
- ✅ Automatic cleanup
- ✅ Full width display

Simply copy the functions, integrate them into your video panel, and call `addWaveformToTile` when in audio mode!






