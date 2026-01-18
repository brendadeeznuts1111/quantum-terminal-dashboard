// Optimization 9: Zero-allocation colour strings
"use strict";

// Pre-compute the 360 HSL tension colours once at boot
const TENSION_COLOURS = Array.from({length: 360}, (_, i) => `hsl(${i} 100% 50%)`);

// Fast tension-to-colour lookup - no string concatenation, no GC
export function tensionToHSL(tension) {
  // Normalize tension to 0-359 range
  const index = Math.floor(tension * 359) & 0x1FF; // Mask to 0-511 for safety
  return TENSION_COLOURS[index % 360];
}

// Batch colour lookup for multiple tensions
export function batchTensionToHSL(tensions, output) {
  const len = tensions.length;
  for (let i = 0; i < len; i++) {
    const index = Math.floor(tensions[i] * 359) & 0x1FF;
    output[i] = TENSION_COLOURS[index % 360];
  }
  return output;
}

// Pre-computed gradient colours for progress bars
const GRADIENT_COLOURS = Array.from({length: 100}, (_, i) => {
  const hue = (i * 120) / 100; // 0 (red) to 120 (green)
  return `\x1b[38;2;${Math.floor(hue < 60 ? 255 : hue < 120 ? 255 - (hue - 60) * 4.25 : 0)};${Math.floor(hue < 60 ? hue * 4.25 : hue < 120 ? 255 : 255 - (hue - 120) * 4.25)};0m`;
});

export function getGradientColour(percentage) {
  const index = Math.min(99, Math.max(0, Math.floor(percentage * 100)));
  return GRADIENT_COLOURS[index];
}

// ANSI reset code (constant)
export const ANSI_RESET = '\x1b[0m';

export default {
  TENSION_COLOURS,
  tensionToHSL,
  batchTensionToHSL,
  GRADIENT_COLOURS,
  getGradientColour,
  ANSI_RESET
};
