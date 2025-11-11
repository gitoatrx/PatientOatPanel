# Audio Waveform Bars CSS Documentation

This document contains the CSS styles used for creating the audio waveform visualization bars in the telehealth video panel.

## Overview

The waveform consists of:
- A container that positions the waveform over the avatar
- A bars container that holds all the individual bars
- Individual bar wrappers, each containing a top and bottom bar that extend symmetrically

## CSS Structure

### 1. Waveform Container (`.audio-waveform-container`)

The main container that positions the waveform exactly over the avatar center.

```css
.audio-waveform-container {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%); /* Perfectly center on avatar */
  width: 100%; /* Full container width */
  height: 60px; /* Height for waveform */
  z-index: 25; /* Behind avatar (avatar should be z-index: 30) */
  pointer-events: none;
  padding: 0; /* No padding to ensure perfect centering */
  opacity: 1;
  visibility: visible;
  margin: 0; /* No margin */
}
```

### 2. Bars Container (`.waveform-bars-container`)

The flex container that holds all the individual bars and distributes them evenly.

```css
.waveform-bars-container {
  display: flex;
  align-items: center; /* Center bars vertically (horizontal baseline) */
  justify-content: space-evenly; /* Distribute bars evenly across full width */
  gap: 3px; /* Gap between bars */
  height: 100%;
  width: 100%;
  flex-wrap: nowrap; /* Keep bars in single line */
}
```

### 3. Bar Wrapper

Each individual bar wrapper that contains both top and bottom bar segments.

```css
.bar-wrapper {
  position: relative;
  width: 1px; /* Thin width - adjust as needed */
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* Center top and bottom bars */
  flex: 0 0 auto; /* Don't grow, maintain fixed width */
  align-self: center; /* Ensure vertical centering */
}
```

### 4. Top Bar (`.waveform-bar-top`)

The bar segment that extends upward from the centerline.

```css
.waveform-bar-top {
  width: 100%;
  height: 5%; /* Initial height, will be animated based on audio */
  min-height: 1px;
  max-height: 50%; /* Maximum extension upward */
  background-color: #fbbf24; /* Yellow - adjust color as needed */
  border-radius: 1px; /* Rounded corners */
  transition: height 80ms ease-out;
  box-sizing: border-box;
}
```

### 5. Bottom Bar (`.waveform-bar-bottom`)

The bar segment that extends downward from the centerline.

```css
.waveform-bar-bottom {
  width: 100%;
  height: 5%; /* Initial height, will be animated based on audio */
  min-height: 1px;
  max-height: 50%; /* Maximum extension downward */
  background-color: #fbbf24; /* Yellow - adjust color as needed */
  border-radius: 1px; /* Rounded corners */
  transition: height 80ms ease-out;
  margin-top: 0px;
  box-sizing: border-box;
}
```

## HTML Structure

```html
<div class="audio-waveform-container">
  <div class="waveform-bars-container">
    <!-- Repeat for each bar (typically 80 bars) -->
    <div class="bar-wrapper">
      <div class="waveform-bar-top"></div>
      <div class="waveform-bar-bottom"></div>
    </div>
    <!-- ... more bars ... -->
  </div>
</div>
```

## Configuration Values

- **Bar Count**: 80 bars (adjust based on desired density)
- **Bar Width**: 1px (adjust for thinner/thicker bars)
- **Gap Between Bars**: 3px (adjust for spacing)
- **Container Height**: 60px (adjust for taller/shorter waveform)
- **Color**: Dynamic per participant (default: #fbbf24 - yellow)
- **Border Radius**: 1px (for rounded appearance)

## Customization Options

### To make bars thinner:
```css
.bar-wrapper {
  width: 0.5px; /* Minimum browser-renderable width */
}
```

### To make bars thicker:
```css
.bar-wrapper {
  width: 2px; /* or 3px, etc. */
}
```

### To change gap between bars:
```css
.waveform-bars-container {
  gap: 1px; /* Smaller gap */
  /* or */
  gap: 5px; /* Larger gap */
}
```

### To change bar color:
```css
.waveform-bar-top,
.waveform-bar-bottom {
  background-color: #your-color; /* e.g., #60a5fa for blue */
}
```

### To remove rounded corners:
```css
.waveform-bar-top,
.waveform-bar-bottom {
  border-radius: 0px;
}
```

## Z-Index Hierarchy

For proper layering:
- **Waveform Container**: `z-index: 25`
- **Avatar**: `z-index: 30` (should be above waveform)

## Animation

The bars are animated via JavaScript by updating the `height` style property of `.waveform-bar-top` and `.waveform-bar-bottom` based on audio frequency data. The transition property ensures smooth animations:

```css
transition: height 80ms ease-out;
```

## Positioning Notes

- The waveform container is positioned absolutely and centered using `left: 50%`, `top: 50%`, and `transform: translate(-50%, -50%)`
- This ensures it's perfectly centered over the avatar
- The avatar should use the same positioning method for alignment

## Browser Compatibility

- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Uses standard CSS properties with good browser support
- Minimum bar width of 0.5px is the thinnest browsers can reliably render

## Example Usage

```html
<!-- In your component -->
<div class="audio-waveform-container">
  <div class="waveform-bars-container">
    <!-- Generated dynamically via JavaScript -->
  </div>
</div>
```

```javascript
// JavaScript to create bars
const barCount = 80;
const barsContainer = document.querySelector('.waveform-bars-container');

for (let i = 0; i < barCount; i++) {
  const barWrapper = document.createElement('div');
  barWrapper.className = 'bar-wrapper';
  
  const topBar = document.createElement('div');
  topBar.className = 'waveform-bar-top';
  
  const bottomBar = document.createElement('div');
  bottomBar.className = 'waveform-bar-bottom';
  
  barWrapper.appendChild(topBar);
  barWrapper.appendChild(bottomBar);
  barsContainer.appendChild(barWrapper);
}

// Animate based on audio frequency
function updateWaveform(frequencyData) {
  const bars = document.querySelectorAll('.bar-wrapper');
  bars.forEach((bar, index) => {
    const topBar = bar.querySelector('.waveform-bar-top');
    const bottomBar = bar.querySelector('.waveform-bar-bottom');
    const height = calculateHeightFromFrequency(frequencyData[index]);
    
    topBar.style.height = `${height}%`;
    bottomBar.style.height = `${height}%`;
  });
}
```

