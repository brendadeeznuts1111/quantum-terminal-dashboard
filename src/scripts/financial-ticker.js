/**
 * financial-ticker.js - Terminal Financial Ticker Visualization
 * Displays real-time stock prices in a terminal UI
 *
 * Uses Bun.stringWidth() for accurate Unicode/emoji column alignment
 */

// Configuration
const CONFIG = {
  symbols: (
    process.env.FINANCIAL_SYMBOLS || "AAPL,GOOGL,TSLA,MSFT,AMZN,NVDA"
  ).split(","),
  updateInterval: parseInt(process.env.UPDATE_INTERVAL || "1000"),
  showVolume: process.env.SHOW_VOLUME !== "false",
  showChart: process.env.SHOW_CHART !== "false",
};

// ANSI color codes
const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  white: "\x1b[37m",
  bgBlue: "\x1b[44m",
};

/**
 * Pad string to width using Bun.stringWidth() for accurate Unicode handling
 */
function padEnd(str, width, char = " ") {
  const currentWidth = Bun.stringWidth(str);
  if (currentWidth >= width) return str;
  return str + char.repeat(width - currentWidth);
}

function padStart(str, width, char = " ") {
  const currentWidth = Bun.stringWidth(str);
  if (currentWidth >= width) return str;
  return char.repeat(width - currentWidth) + str;
}

// Base prices for simulation
const BASE_PRICES = {
  AAPL: 178.5,
  GOOGL: 141.25,
  TSLA: 248.75,
  MSFT: 378.9,
  AMZN: 178.35,
  NVDA: 875.4,
  META: 485.2,
  NFLX: 628.5,
  AMD: 165.3,
  INTC: 42.8,
};

// Price history for mini charts
const priceHistory = new Map();
CONFIG.symbols.forEach((sym) => priceHistory.set(sym, []));

/**
 * Generate simulated price
 */
function generatePrice(symbol) {
  const base = BASE_PRICES[symbol] || 100;
  const variance = base * 0.003; // 0.3% variance
  return base + (Math.random() * variance * 2 - variance);
}

/**
 * Generate mini sparkline chart
 */
function generateSparkline(history, width = 10) {
  if (history.length < 2) return " ".repeat(width);

  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;

  const chars = [
    "_",
    "\u2581",
    "\u2582",
    "\u2583",
    "\u2584",
    "\u2585",
    "\u2586",
    "\u2587",
    "\u2588",
  ];

  return history
    .slice(-width)
    .map((val) => {
      const normalized = (val - min) / range;
      const index = Math.floor(normalized * (chars.length - 1));
      return chars[index];
    })
    .join("");
}

/**
 * Format number with color based on sign
 */
function formatChange(value, includeSign = true) {
  const color = value >= 0 ? COLORS.green : COLORS.red;
  const sign = value >= 0 && includeSign ? "+" : "";
  return `${color}${sign}${value.toFixed(2)}${COLORS.reset}`;
}

/**
 * Format large numbers
 */
function formatVolume(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toString();
}

/**
 * Clear screen and move cursor to top
 */
function clearScreen() {
  process.stdout.write("\x1b[2J\x1b[H");
}

/**
 * Draw header
 */
function drawHeader() {
  const time = new Date().toLocaleTimeString();
  const date = new Date().toLocaleDateString();

  console.log(`${COLORS.cyan}${COLORS.bright}${"=".repeat(80)}${COLORS.reset}`);
  console.log(
    `${COLORS.cyan}${COLORS.bright}  QUANTUM FINANCIAL TICKER${COLORS.reset}${" ".repeat(30)}${COLORS.dim}${date} ${time}${COLORS.reset}`,
  );
  console.log(`${COLORS.cyan}${COLORS.bright}${"=".repeat(80)}${COLORS.reset}`);
  console.log();
}

/**
 * Draw table header using Bun.stringWidth() for accurate alignment
 */
function drawTableHeader() {
  const header = [
    padEnd("SYMBOL", 8),
    padStart("PRICE", 12),
    padStart("CHANGE", 10),
    padStart("%", 8),
    CONFIG.showVolume ? padStart("VOLUME", 10) : "",
    CONFIG.showChart ? padStart("TREND", 12) : "",
  ]
    .filter(Boolean)
    .join(" | ");

  console.log(`${COLORS.dim}${header}${COLORS.reset}`);
  console.log(`${COLORS.dim}${"-".repeat(80)}${COLORS.reset}`);
}

/**
 * Draw stock row using Bun.stringWidth() for Unicode-aware alignment
 */
function drawStockRow(symbol, data) {
  const { price, change, percent, volume, history } = data;

  const arrow = change >= 0 ? "\u25B2" : "\u25BC";
  const changeColor = change >= 0 ? COLORS.green : COLORS.red;

  const row = [
    `${COLORS.cyan}${COLORS.bright}${padEnd(symbol, 8)}${COLORS.reset}`,
    `${COLORS.white}$${padStart(price.toFixed(2), 10)}${COLORS.reset}`,
    `${changeColor}${arrow} ${padStart(Math.abs(change).toFixed(2), 7)}${COLORS.reset}`,
    `${changeColor}${padStart((percent >= 0 ? "+" : "") + percent.toFixed(2), 6)}%${COLORS.reset}`,
    CONFIG.showVolume
      ? `${COLORS.dim}${padStart(formatVolume(volume), 10)}${COLORS.reset}`
      : "",
    CONFIG.showChart
      ? `${changeColor}${generateSparkline(history, 10)}${COLORS.reset}`
      : "",
  ]
    .filter(Boolean)
    .join(" | ");

  console.log(row);
}

/**
 * Draw footer
 */
function drawFooter(stats) {
  console.log();
  console.log(`${COLORS.dim}${"-".repeat(80)}${COLORS.reset}`);

  const gainers = stats.filter((s) => s.change >= 0).length;
  const losers = stats.length - gainers;

  console.log(
    [
      `${COLORS.dim}Tracking: ${COLORS.cyan}${stats.length}${COLORS.reset}`,
      `${COLORS.green}Gainers: ${gainers}${COLORS.reset}`,
      `${COLORS.red}Losers: ${losers}${COLORS.reset}`,
      `${COLORS.dim}Update: ${CONFIG.updateInterval}ms${COLORS.reset}`,
    ].join(" | "),
  );

  console.log();
  console.log(`${COLORS.dim}Press Ctrl+C to exit${COLORS.reset}`);
}

/**
 * Main update loop
 */
function update() {
  clearScreen();
  drawHeader();
  drawTableHeader();

  const stats = [];

  CONFIG.symbols.forEach((symbol) => {
    const price = generatePrice(symbol);
    const history = priceHistory.get(symbol);

    // Update history
    history.push(price);
    if (history.length > 20) history.shift();

    // Calculate change from first price in history
    const firstPrice = history[0] || price;
    const change = price - firstPrice;
    const percent = (change / firstPrice) * 100;

    // Generate volume
    const volume = Math.floor(Math.random() * 50000000) + 1000000;

    const data = { price, change, percent, volume, history: [...history] };
    stats.push({ symbol, ...data });

    drawStockRow(symbol, data);
  });

  drawFooter(stats);
}

/**
 * Start ticker
 */
function start() {
  console.log(
    `${COLORS.cyan}Starting Quantum Financial Ticker...${COLORS.reset}`,
  );
  console.log(
    `${COLORS.dim}Symbols: ${CONFIG.symbols.join(", ")}${COLORS.reset}`,
  );
  console.log(
    `${COLORS.dim}Update interval: ${CONFIG.updateInterval}ms${COLORS.reset}`,
  );
  console.log();

  // Initial update
  update();

  // Set up interval
  const interval = setInterval(update, CONFIG.updateInterval);

  // Handle exit
  process.on("SIGINT", () => {
    clearInterval(interval);
    clearScreen();
    console.log(
      `\n${COLORS.cyan}Quantum Financial Ticker stopped.${COLORS.reset}\n`,
    );
    process.exit(0);
  });
}

// Start if run directly
if (import.meta.main) {
  start();
}

export { start, update, CONFIG };
