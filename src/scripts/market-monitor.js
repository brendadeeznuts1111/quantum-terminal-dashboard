/**
 * market-monitor.js - htop-style Market Process Monitor
 * Displays trading bot status, P&L, and system metrics
 *
 * Uses Bun.stringWidth() for accurate Unicode/emoji column alignment
 */

/**
 * Pad string to width using Bun.stringWidth() for accurate Unicode handling
 */
function padEnd(str, width, char = ' ') {
  const s = String(str);
  const currentWidth = Bun.stringWidth(s);
  if (currentWidth >= width) return s;
  return s + char.repeat(width - currentWidth);
}

function padStart(str, width, char = ' ') {
  const s = String(str);
  const currentWidth = Bun.stringWidth(s);
  if (currentWidth >= width) return s;
  return char.repeat(width - currentWidth) + s;
}

// Configuration
const CONFIG = {
  symbols: (process.env.FINANCIAL_SYMBOLS || 'AAPL,GOOGL,TSLA,MSFT,AMZN,NVDA').split(','),
  updateInterval: parseInt(process.env.UPDATE_INTERVAL || '2000'),
  showSystemMetrics: process.env.SHOW_SYSTEM !== 'false'
};

// ANSI codes
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  underline: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',

  // Cursor
  clearScreen: '\x1b[2J',
  cursorHome: '\x1b[H',
  hideCursor: '\x1b[?25l',
  showCursor: '\x1b[?25h'
};

// Trading bot states
const BOT_STATES = ['ACTIVE', 'PAUSED', 'WAITING', 'TRADING', 'ANALYZING'];
const BOT_STATE_COLORS = {
  ACTIVE: ANSI.green,
  PAUSED: ANSI.yellow,
  WAITING: ANSI.blue,
  TRADING: ANSI.magenta,
  ANALYZING: ANSI.cyan
};

// Simulated trading bots
const tradingBots = CONFIG.symbols.map((symbol, idx) => ({
  pid: 1000 + idx,
  symbol,
  state: BOT_STATES[Math.floor(Math.random() * BOT_STATES.length)],
  price: 0,
  position: Math.floor(Math.random() * 1000) - 500,
  pnl: 0,
  trades: Math.floor(Math.random() * 100),
  cpu: 0,
  mem: 0,
  uptime: Date.now() - Math.floor(Math.random() * 3600000)
}));

/**
 * Get terminal dimensions
 */
function getTerminalSize() {
  return {
    cols: process.stdout.columns || 80,
    rows: process.stdout.rows || 24
  };
}

/**
 * Format duration
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Format P&L with color
 */
function formatPnL(value) {
  const color = value >= 0 ? ANSI.green : ANSI.red;
  const sign = value >= 0 ? '+' : '';
  return `${color}${sign}$${value.toFixed(2)}${ANSI.reset}`;
}

/**
 * Draw progress bar
 */
function progressBar(value, max, width = 10, filled = '\u2588', empty = '\u2591') {
  const percent = Math.min(value / max, 1);
  const filledCount = Math.floor(percent * width);
  const emptyCount = width - filledCount;

  let color = ANSI.green;
  if (percent > 0.7) color = ANSI.yellow;
  if (percent > 0.9) color = ANSI.red;

  return `${color}${filled.repeat(filledCount)}${ANSI.dim}${empty.repeat(emptyCount)}${ANSI.reset}`;
}

/**
 * Draw header with system metrics
 */
function drawHeader() {
  const { cols } = getTerminalSize();
  const now = new Date();

  // System metrics
  const memUsage = process.memoryUsage();
  const cpuUsage = Math.random() * 30 + 10; // Simulated
  const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  console.log(`${ANSI.bgBlue}${ANSI.white}${ANSI.bold}${'='.repeat(cols)}${ANSI.reset}`);

  // Title line
  const title = '  QUANTUM MARKET MONITOR';
  const time = now.toLocaleTimeString();
  const padding = cols - title.length - time.length - 2;
  console.log(`${ANSI.bgBlue}${ANSI.white}${ANSI.bold}${title}${' '.repeat(padding)}${time}  ${ANSI.reset}`);

  console.log(`${ANSI.bgBlue}${ANSI.white}${ANSI.bold}${'='.repeat(cols)}${ANSI.reset}`);

  if (CONFIG.showSystemMetrics) {
    console.log();
    console.log([
      `${ANSI.bold}CPU:${ANSI.reset} ${progressBar(cpuUsage, 100, 15)} ${cpuUsage.toFixed(1)}%`,
      `${ANSI.bold}MEM:${ANSI.reset} ${progressBar(memPercent, 100, 15)} ${memPercent.toFixed(1)}%`,
      `${ANSI.bold}Heap:${ANSI.reset} ${ANSI.cyan}${(memUsage.heapUsed / 1e6).toFixed(1)}MB${ANSI.reset}`
    ].join('  '));
    console.log();
  }
}

/**
 * Draw table header using Bun.stringWidth() for accurate alignment
 */
function drawTableHeader() {
  const headers = [
    padEnd('PID', 6),
    padEnd('SYMBOL', 8),
    padEnd('STATE', 12),
    padStart('PRICE', 12),
    padStart('POSITION', 10),
    padStart('P&L', 12),
    padStart('TRADES', 8),
    padStart('CPU%', 6),
    padStart('MEM%', 6),
    padStart('UPTIME', 10)
  ];

  console.log(`${ANSI.bold}${ANSI.underline}${headers.join(' ')}${ANSI.reset}`);
}

/**
 * Update and draw bot row
 */
function drawBotRow(bot) {
  // Update simulated values
  const basePrice = {
    AAPL: 178.50, GOOGL: 141.25, TSLA: 248.75, MSFT: 378.90, AMZN: 178.35, NVDA: 875.40
  }[bot.symbol] || 100;

  bot.price = basePrice * (1 + (Math.random() * 0.02 - 0.01));
  bot.pnl += (Math.random() * 200 - 100);
  bot.cpu = Math.random() * 15 + 2;
  bot.mem = Math.random() * 5 + 1;

  // Occasionally change state
  if (Math.random() < 0.1) {
    bot.state = BOT_STATES[Math.floor(Math.random() * BOT_STATES.length)];
  }

  // Occasionally execute trade
  if (bot.state === 'TRADING' && Math.random() < 0.3) {
    bot.trades++;
    bot.position += Math.floor(Math.random() * 20 - 10);
  }

  const stateColor = BOT_STATE_COLORS[bot.state] || ANSI.white;
  const uptime = formatDuration(Date.now() - bot.uptime);

  // Use Bun.stringWidth() for accurate column alignment with Unicode
  const cols = [
    `${ANSI.dim}${padEnd(bot.pid.toString(), 6)}${ANSI.reset}`,
    `${ANSI.cyan}${ANSI.bold}${padEnd(bot.symbol, 8)}${ANSI.reset}`,
    `${stateColor}${padEnd(bot.state, 12)}${ANSI.reset}`,
    `${ANSI.white}$${padStart(bot.price.toFixed(2), 10)}${ANSI.reset}`,
    `${bot.position >= 0 ? ANSI.green : ANSI.red}${padStart(bot.position.toString(), 10)}${ANSI.reset}`,
    padStart(formatPnL(bot.pnl), 20),
    `${ANSI.dim}${padStart(bot.trades.toString(), 8)}${ANSI.reset}`,
    `${bot.cpu > 10 ? ANSI.yellow : ANSI.dim}${padStart(bot.cpu.toFixed(1), 6)}${ANSI.reset}`,
    `${bot.mem > 3 ? ANSI.yellow : ANSI.dim}${padStart(bot.mem.toFixed(1), 6)}${ANSI.reset}`,
    `${ANSI.dim}${padStart(uptime, 10)}${ANSI.reset}`
  ];

  console.log(cols.join(' '));
}

/**
 * Draw summary footer
 */
function drawFooter() {
  console.log();
  console.log(`${ANSI.dim}${'─'.repeat(100)}${ANSI.reset}`);

  // Calculate totals
  const totalPnL = tradingBots.reduce((sum, bot) => sum + bot.pnl, 0);
  const totalTrades = tradingBots.reduce((sum, bot) => sum + bot.trades, 0);
  const activeCount = tradingBots.filter(b => b.state === 'ACTIVE' || b.state === 'TRADING').length;

  console.log([
    `${ANSI.bold}Total P&L:${ANSI.reset} ${formatPnL(totalPnL)}`,
    `${ANSI.bold}Trades:${ANSI.reset} ${ANSI.cyan}${totalTrades}${ANSI.reset}`,
    `${ANSI.bold}Active:${ANSI.reset} ${ANSI.green}${activeCount}${ANSI.reset}/${tradingBots.length}`,
    `${ANSI.bold}Update:${ANSI.reset} ${ANSI.dim}${CONFIG.updateInterval}ms${ANSI.reset}`
  ].join('  |  '));

  console.log();
  console.log(`${ANSI.dim}F1: Help  F2: Add Bot  F3: Kill Bot  F5: Refresh  F10: Quit  ${ANSI.yellow}Ctrl+C: Exit${ANSI.reset}`);
}

/**
 * Main render function
 */
function render() {
  process.stdout.write(ANSI.clearScreen + ANSI.cursorHome);

  drawHeader();
  drawTableHeader();

  tradingBots.forEach(bot => drawBotRow(bot));

  drawFooter();
}

/**
 * Start monitor
 */
function start() {
  process.stdout.write(ANSI.hideCursor);

  console.log(`${ANSI.cyan}Starting Quantum Market Monitor...${ANSI.reset}`);
  console.log(`${ANSI.dim}Monitoring ${tradingBots.length} trading bots${ANSI.reset}`);

  setTimeout(() => {
    render();

    const interval = setInterval(render, CONFIG.updateInterval);

    // Handle exit
    process.on('SIGINT', () => {
      clearInterval(interval);
      process.stdout.write(ANSI.showCursor);
      process.stdout.write(ANSI.clearScreen + ANSI.cursorHome);
      console.log(`\n${ANSI.cyan}Quantum Market Monitor stopped.${ANSI.reset}\n`);
      process.exit(0);
    });

    // Handle resize
    process.stdout.on('resize', render);
  }, 1000);
}

// Start if run directly
if (import.meta.main) {
  start();
}

export { start, render, tradingBots, CONFIG };
