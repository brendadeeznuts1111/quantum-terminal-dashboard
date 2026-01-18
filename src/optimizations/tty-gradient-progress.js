// Optimization 14: TTY gradient progress bar
"use strict";

import { process } from 'process';

export class TTYGradientProgress {
  constructor(width = 50) {
    this.width = width;
    this.isTTY = process.stdout.isTTY;
    this.lastWidth = 0;
    this.lastProgress = 0;
  }

  // Convert HSL to RGB for ANSI 24-bit colour
  hslToRgb(h, s = 100, l = 50) {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255)
    ];
  }

  // Generate ANSI 24-bit background colour sequence
  bgColour(r, g, b) {
    return `\x1b[48;2;${r};${g};${b}m`;
  }

  // Reset ANSI colours
  reset() {
    return '\x1b[0m';
  }

  // Create gradient progress bar with single Unicode block
  createGradient(progress, useFullBlock = true) {
    if (!this.isTTY) {
      return this.createAsciiProgress(progress);
    }

    const clampedProgress = Math.min(1, Math.max(0, progress));
    const filledWidth = Math.floor(clampedProgress * this.width);
    
    if (filledWidth === 0) {
      return ' '.repeat(this.width);
    }

    // Calculate colour based on progress (red -> yellow -> green)
    const hue = clampedProgress * 120; // 0 (red) to 120 (green)
    const [r, g, b] = this.hslToRgb(hue);
    const bg = this.bgColour(r, g, b);
    const reset = this.reset();

    // Single write syscall - no per-character loops
    const block = useFullBlock ? ' ' : '▓';
    const bar = bg + block.repeat(filledWidth) + reset + ' '.repeat(this.width - filledWidth);
    
    return bar;
  }

  // Fallback for non-TTY environments
  createAsciiProgress(progress) {
    const clampedProgress = Math.min(1, Math.max(0, progress));
    const filledWidth = Math.floor(clampedProgress * this.width);
    const bar = '█'.repeat(filledWidth) + '░'.repeat(this.width - filledWidth);
    return bar;
  }

  // Ultra-fast progress bar update (single write)
  update(progress, prefix = '', suffix = '') {
    if (!this.isTTY) {
      console.log(`${prefix}${this.createAsciiProgress(progress)}${suffix}`);
      return;
    }

    // Only update if progress changed significantly (reduces writes)
    const progressDelta = Math.abs(progress - this.lastProgress);
    if (progressDelta < 0.01 && this.lastWidth === this.width) {
      return;
    }

    const bar = this.createGradient(progress);
    const line = `\r${prefix}${bar}${suffix}`;
    
    // Single write syscall
    process.stdout.write(line);
    
    this.lastProgress = progress;
    this.lastWidth = this.width;
  }

  // Tension-specific progress bar with colour mapping
  updateTension(tension, maxTension = 1.0, prefix = 'Tension: ') {
    const progress = Math.min(1, tension / maxTension);
    
    // Special colour mapping for tension (blue -> red)
    const hue = (1 - progress) * 240; // 240 (blue) to 0 (red)
    const [r, g, b] = this.hslToRgb(hue, 100, 50);
    const bg = this.bgColour(r, g, b);
    const reset = this.reset();
    
    const filledWidth = Math.floor(progress * this.width);
    const bar = bg + ' '.repeat(filledWidth) + reset + ' '.repeat(this.width - filledWidth);
    const percentage = (progress * 100).toFixed(1);
    
    process.stdout.write(`\r${prefix}[${bar}] ${percentage}%`);
  }

  // Multi-colour gradient for complex visualizations
  createMultiGradient(values, colours) {
    if (!this.isTTY || values.length === 0) {
      return ' '.repeat(this.width);
    }

    const segmentWidth = Math.floor(this.width / values.length);
    let result = '';

    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const colour = colours[i % colours.length];
      const filledWidth = Math.floor(value * segmentWidth);
      
      if (filledWidth > 0) {
        result += colour + ' '.repeat(filledWidth) + this.reset();
      }
      result += ' '.repeat(segmentWidth - filledWidth);
    }

    return result.padEnd(this.width);
  }

  // Animated progress bar with smooth transitions
  async animateProgress(targetProgress, duration = 1000, steps = 20) {
    const startProgress = this.lastProgress;
    const stepDelay = duration / steps;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // Ease in-out
      const currentProgress = startProgress + (targetProgress - startProgress) * easeT;
      
      this.update(currentProgress);
      await new Promise(resolve => setTimeout(resolve, stepDelay));
    }
  }

  // Clear the progress line
  clear() {
    if (this.isTTY) {
      process.stdout.write('\r' + ' '.repeat(process.stdout.columns || 80) + '\r');
    }
  }

  // Finish with completion message
  finish(message = 'Complete!') {
    if (this.isTTY) {
      this.update(1.0, '', ` ${message}`);
      process.stdout.write('\n');
    } else {
      console.log(message);
    }
  }

  // Get terminal width for responsive progress bars
  getTerminalWidth() {
    if (this.isTTY && process.stdout.columns) {
      return Math.max(10, process.stdout.columns - 10);
    }
    return this.width;
  }

  // Responsive progress bar that adapts to terminal size
  updateResponsive(progress, prefix = '', suffix = '') {
    const currentWidth = this.getTerminalWidth();
    if (currentWidth !== this.width) {
      this.width = currentWidth;
    }
    this.update(progress, prefix, suffix);
  }

  // Create spinner with gradient colours
  createSpinner(frame = 0) {
    const spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    const spinner = spinners[frame % spinners.length];
    const hue = (frame * 36) % 360; // Rotate through colours
    const [r, g, b] = this.hslToRgb(hue);
    const colour = this.bgColour(r, g, b);
    
    return colour + spinner + this.reset();
  }
}

// Pre-computed gradient colours for common progress values
const PRESET_GRADIENTS = {
  success: Array.from({length: 101}, (_, i) => {
    const [r, g, b] = new TTYGradientProgress().hslToRgb((i * 120) / 100, 100, 50);
    return `\x1b[48;2;${r};${g};${b}m`;
  }),
  warning: Array.from({length: 101}, (_, i) => {
    const [r, g, b] = new TTYGradientProgress().hslToRgb(60, 100, 50);
    return `\x1b[48;2;${r};${g};${b}m`;
  }),
  error: Array.from({length: 101}, (_, i) => {
    const [r, g, b] = new TTYGradientProgress().hslToRgb(0, 100, 50);
    return `\x1b[48;2;${r};${g};${b}m`;
  })
};

// Fast preset gradient lookup
export function getPresetGradient(type, percentage) {
  const index = Math.min(100, Math.max(0, Math.floor(percentage * 100)));
  return PRESET_GRADIENTS[type]?.[index] || PRESET_GRADIENTS.success[index];
}

export default TTYGradientProgress;
