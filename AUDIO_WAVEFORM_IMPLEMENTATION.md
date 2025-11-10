# Audio Waveform Visualization Implementation

## Overview

This document describes the implementation of real-time audio waveform visualization for the telehealth audio call interface. The feature displays animated vertical bars that respond to audio frequency data, providing visual feedback for active audio participants during audio-only calls.

## Features

- **Real-time Audio Visualization**: Vertical bars that animate based on audio frequency data
- **Dual-Directional Bars**: Bars extend both upward and downward from a center line
- **Multiple Participants**: Each participant gets a unique color for their waveform
- **Full Width Display**: Waveforms use the full allocated width of participant tiles
- **Native Web Audio API**: No external dependencies required

## Architecture

### Components

The waveform visualization is integrated directly into the `TelehealthVideoPanel` component through the `normalizeVideoElements` function, which is called when `callMode === 'audio'`.

### Key Functions

#### 1. `getParticipantColor(connectionId, isLocal, participantIndex)`

Assigns a unique color to each participant based on their connection ID.

**Implementation:**
- Uses a hash function on the `connectionId` to ensure consistent color assignment
- Falls back to index-based assignment if no connectionId is available
- Supports up to 10 different colors from a predefined palette

**Color Palette:**
```typescript
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
```

#### 2. `addWaveformToTile(wrapper, video, isLocal, connectionId, participantIndex)`

Creates and manages the waveform visualization for a single participant tile.

**Parameters:**
- `wrapper`: HTML element containing the video tile
- `video`: HTMLVideoElement with the audio stream
- `isLocal`: Boolean indicating if this is the local participant
- `connectionId`: Unique identifier for the participant (optional)
- `participantIndex`: Index for fallback color assignment (optional)

**Process:**
1. Creates a waveform container positioned to start from the avatar
2. Generates 25 vertical bars (top and bottom segments for each)
3. Sets up Web Audio API analysis
4. Animates bars based on real-time frequency data

## Technical Implementation

### Web Audio API Integration

The implementation uses the native Web Audio API to analyze audio frequency data:

```typescript
// Create audio context and analyser
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
const source = audioContext.createMediaStreamSource(video.srcObject);

// Configure analyser
analyser.fftSize = 256;
analyser.smoothingTimeConstant = 0.8;
source.connect(analyser);
```

### Frequency Data Processing

1. **Data Extraction**: Uses `getByteFrequencyData()` to get frequency bin data
2. **Bar Mapping**: Maps each bar to a frequency range
3. **Amplitude Calculation**: Normalizes and amplifies frequency values
4. **Height Update**: Updates bar heights based on calculated amplitude

```typescript
// Map bar index to frequency bin
const freqIndex = Math.floor((index / barCount) * bufferLength);
const freqValue = dataArray[Math.min(freqIndex, bufferLength - 1)];

// Normalize and calculate height
const normalized = freqValue / 255;
const amplified = Math.pow(normalized, 0.6);
const heightPercent = Math.max(10, amplified * 50); // 10% to 50% for each side
```

### Animation Loop

Uses `requestAnimationFrame` for smooth, real-time updates:

```typescript
const updateWaveform = () => {
  analyser.getByteFrequencyData(dataArray);
  // Update all bars
  bars.forEach((barWrapper, index) => {
    // Calculate and update bar heights
  });
  animationFrameId = requestAnimationFrame(updateWaveform);
};
```

## Visual Design

### Bar Structure

Each waveform consists of:
- **25 vertical bars** arranged horizontally
- Each bar has **two segments**:
  - Top segment: Extends upward from center
  - Bottom segment: Extends downward from center
- **3px gap** between bars
- **4px width** per bar

### Positioning

- **Container**: Positioned at 50% left, 50% top (centered on avatar)
- **Width**: `calc(100% - 100px)` to use full width minus avatar space
- **Max Width**: 400px to prevent excessive width on large screens
- **Height**: 80px

### Colors

- Each participant gets a unique color from the palette
- Color is determined by hashing the participant's `connectionId`
- Ensures consistent color assignment for the same participant

## Integration Points

### TelehealthVideoPanel

The waveform is added when:
1. `callMode === 'audio'` is true
2. `normalizeVideoElements` is called with `isAudioMode: true`
3. The function checks for existing waveforms to avoid duplicates

### NormalizeVideoElements Function

```typescript
// Add waveform visualization in audio mode
if (opts?.isAudioMode && !skipOverlays) {
  const isLocal = isLocalContainer;
  const connectionId = wrapper.dataset.connectionId || '';
  addWaveformToTile(wrapper, video, isLocal, connectionId, index);
}
```

## Audio Stream Extraction

The audio streams are extracted from Vonage video elements:

1. **Local Stream**: From `#vonage-local-container` video element
2. **Remote Streams**: From `#vonage-remote-container` video elements
3. **Connection Matching**: Uses `data-connection-id` attributes set by Vonage to match streams to participants

## Performance Considerations

### Optimization Techniques

1. **Throttled Updates**: Uses `requestAnimationFrame` for smooth 60fps updates
2. **Efficient DOM Updates**: Only updates bar heights, not entire DOM structure
3. **Cleanup**: Properly disconnects audio sources and closes audio contexts when tiles are removed
4. **Duplicate Prevention**: Checks for existing waveforms before creating new ones

### Memory Management

- Audio contexts are properly closed when components unmount
- Audio sources are disconnected to prevent memory leaks
- Animation frames are cancelled when containers are removed

## Browser Compatibility

### Web Audio API Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (may require user interaction first)
- **Mobile Browsers**: Full support on modern mobile browsers

### Fallbacks

- If Web Audio API is not available, waveform simply won't render
- No errors are thrown, ensuring graceful degradation

## Usage Example

The waveform automatically appears when:
1. A call is in audio mode (`callMode === 'audio'`)
2. Participants have active audio streams
3. The `TelehealthVideoPanel` component renders participant tiles

No additional configuration is required - the feature works automatically when audio mode is detected.

## Code Location

- **Main Implementation**: `src/components/telehealth/TelehealthVideoPanel.tsx`
- **Functions**: 
  - `getParticipantColor()` - Lines 135-148
  - `addWaveformToTile()` - Lines 150-280
  - Integration in `normalizeVideoElements()` - Lines 649-655

## Future Enhancements

Potential improvements:
1. Configurable bar count based on screen size
2. Different animation styles (sine wave, bars, etc.)
3. Smooth color transitions
4. Muted state visualization (grayed out bars)
5. Audio level indicators combined with waveforms

## Troubleshooting

### Waveforms Not Appearing

1. **Check Audio Stream**: Ensure video elements have `srcObject` with audio tracks
2. **Check Audio Mode**: Verify `callMode === 'audio'` is set
3. **Check Permissions**: Ensure microphone permissions are granted
4. **Browser Console**: Check for Web Audio API errors

### Performance Issues

1. **Reduce Bar Count**: Lower `barCount` from 25 to 15-18
2. **Increase Smoothing**: Adjust `smoothingTimeConstant` to 0.9 for smoother but slower updates
3. **Check Audio Context**: Ensure only one audio context per stream

## Dependencies

- **None**: Uses only native browser APIs
  - Web Audio API (`AudioContext`, `AnalyserNode`)
  - DOM APIs
  - `requestAnimationFrame`

## Conclusion

The audio waveform visualization provides an intuitive visual representation of audio activity during calls, enhancing the user experience by clearly showing which participants are speaking. The implementation is lightweight, performant, and requires no external dependencies.

