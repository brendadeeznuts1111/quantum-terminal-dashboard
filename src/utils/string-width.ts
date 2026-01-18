/**
 * string-width.ts - Unicode String Width Utilities
 * Uses Bun.stringWidth() for accurate terminal display width
 *
 * Handles:
 * - Zero-width characters (soft hyphen, word joiner, Arabic formatting, Indic/Thai/Lao marks)
 * - ANSI escape sequences (CSI, OSC including hyperlinks)
 * - Emoji (flags, skin tones, ZWJ sequences, keycaps, variation selectors)
 */

/**
 * Get terminal display width of a string
 * Uses Bun.stringWidth() for accurate Unicode handling
 */
export function stringWidth(str: string): number {
  return Bun.stringWidth(str);
}

/**
 * Pad string to exact terminal width (right-aligned content)
 */
export function padStart(str: string, width: number, char = ' '): string {
  const currentWidth = Bun.stringWidth(str);
  if (currentWidth >= width) return str;
  return char.repeat(width - currentWidth) + str;
}

/**
 * Pad string to exact terminal width (left-aligned content)
 */
export function padEnd(str: string, width: number, char = ' '): string {
  const currentWidth = Bun.stringWidth(str);
  if (currentWidth >= width) return str;
  return str + char.repeat(width - currentWidth);
}

/**
 * Center string within terminal width
 */
export function padCenter(str: string, width: number, char = ' '): string {
  const currentWidth = Bun.stringWidth(str);
  if (currentWidth >= width) return str;

  const totalPadding = width - currentWidth;
  const leftPad = Math.floor(totalPadding / 2);
  const rightPad = totalPadding - leftPad;

  return char.repeat(leftPad) + str + char.repeat(rightPad);
}

/**
 * Truncate string to fit terminal width, adding ellipsis if needed
 */
export function truncate(str: string, maxWidth: number, ellipsis = '…'): string {
  const strWidth = Bun.stringWidth(str);
  if (strWidth <= maxWidth) return str;

  const ellipsisWidth = Bun.stringWidth(ellipsis);
  const targetWidth = maxWidth - ellipsisWidth;

  if (targetWidth <= 0) {
    return ellipsis.slice(0, maxWidth);
  }

  // Build string character by character until we hit target width
  let result = '';
  let currentWidth = 0;

  for (const char of str) {
    const charWidth = Bun.stringWidth(char);
    if (currentWidth + charWidth > targetWidth) break;
    result += char;
    currentWidth += charWidth;
  }

  return result + ellipsis;
}

/**
 * Wrap text to fit terminal width, respecting word boundaries
 */
export function wordWrap(str: string, maxWidth: number): string[] {
  const lines: string[] = [];
  const words = str.split(/(\s+)/);

  let currentLine = '';
  let currentWidth = 0;

  for (const word of words) {
    const wordWidth = Bun.stringWidth(word);

    if (currentWidth + wordWidth <= maxWidth) {
      currentLine += word;
      currentWidth += wordWidth;
    } else if (wordWidth > maxWidth) {
      // Word itself is too long, need to break it
      if (currentLine) {
        lines.push(currentLine);
        currentLine = '';
        currentWidth = 0;
      }

      // Break long word across lines
      let remaining = word;
      while (Bun.stringWidth(remaining) > maxWidth) {
        const truncated = truncate(remaining, maxWidth, '');
        lines.push(truncated);
        remaining = remaining.slice(truncated.length);
      }
      currentLine = remaining;
      currentWidth = Bun.stringWidth(remaining);
    } else {
      // Start new line
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = word.trimStart();
      currentWidth = Bun.stringWidth(currentLine);
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Format table cell with proper alignment
 */
export function formatCell(
  content: string,
  width: number,
  align: 'left' | 'right' | 'center' = 'left'
): string {
  const truncated = truncate(content, width);

  switch (align) {
    case 'right':
      return padStart(truncated, width);
    case 'center':
      return padCenter(truncated, width);
    default:
      return padEnd(truncated, width);
  }
}

/**
 * Calculate column widths for a table based on content
 */
export function calculateColumnWidths(
  rows: string[][],
  maxTotalWidth?: number,
  minColumnWidth = 3
): number[] {
  if (rows.length === 0) return [];

  const columnCount = Math.max(...rows.map(row => row.length));
  const widths: number[] = new Array(columnCount).fill(0);

  // Find max width for each column
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      const cellWidth = Bun.stringWidth(row[i] || '');
      widths[i] = Math.max(widths[i], cellWidth, minColumnWidth);
    }
  }

  // If total width exceeds max, proportionally reduce
  if (maxTotalWidth) {
    const separatorWidth = columnCount - 1; // Assuming 1 char separators
    const totalContentWidth = widths.reduce((a, b) => a + b, 0);
    const availableWidth = maxTotalWidth - separatorWidth;

    if (totalContentWidth > availableWidth) {
      const scale = availableWidth / totalContentWidth;
      for (let i = 0; i < widths.length; i++) {
        widths[i] = Math.max(Math.floor(widths[i] * scale), minColumnWidth);
      }
    }
  }

  return widths;
}

/**
 * Strip ANSI escape codes from string
 */
export function stripAnsi(str: string): string {
  // CSI sequences: ESC [ ... final_byte
  // OSC sequences: ESC ] ... (BEL | ESC \)
  // Simple escapes: ESC followed by single char
  return str.replace(
    /\x1b\[[0-9;]*[A-Za-z]|\x1b\][^\x07]*(?:\x07|\x1b\\)|\x1b[^[\]]/g,
    ''
  );
}

/**
 * Check if string contains emoji
 */
export function containsEmoji(str: string): boolean {
  // Check if stringWidth differs from character count significantly
  // (emoji are typically 2 columns but 1+ code points)
  const width = Bun.stringWidth(str);
  const stripped = stripAnsi(str);
  const codePoints = [...stripped].length;

  // If width is less than codepoints, likely has ZWJ sequences
  // If any char has width 2, likely has emoji
  for (const char of stripped) {
    if (Bun.stringWidth(char) === 2) return true;
  }

  return false;
}

/**
 * Create a horizontal line/separator
 */
export function horizontalLine(width: number, char = '─'): string {
  const charWidth = Bun.stringWidth(char);
  return char.repeat(Math.floor(width / charWidth));
}

/**
 * Create a progress bar with proper width calculation
 */
export function progressBar(
  value: number,
  max: number,
  width: number,
  filled = '█',
  empty = '░',
  showPercent = true
): string {
  const percent = Math.min(Math.max(value / max, 0), 1);
  const percentStr = showPercent ? ` ${(percent * 100).toFixed(0)}%` : '';
  const percentWidth = Bun.stringWidth(percentStr);

  const barWidth = width - 2 - percentWidth; // 2 for brackets [ ]
  const filledWidth = Math.round(barWidth * percent);
  const emptyWidth = barWidth - filledWidth;

  return `[${filled.repeat(filledWidth)}${empty.repeat(emptyWidth)}]${percentStr}`;
}

// Export as namespace for convenient access
export const StringWidth = {
  width: stringWidth,
  padStart,
  padEnd,
  padCenter,
  truncate,
  wordWrap,
  formatCell,
  calculateColumnWidths,
  stripAnsi,
  containsEmoji,
  horizontalLine,
  progressBar
};

export default StringWidth;
