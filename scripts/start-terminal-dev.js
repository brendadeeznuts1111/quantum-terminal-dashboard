/**
 * start-terminal-dev.js - Development Server with Hot Reload
 * Starts the Quantum Terminal Dashboard in development mode
 */

const ROOT_DIR = import.meta.dir.replace("/scripts", "");

// ANSI colors
const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
};

/**
 * Print banner
 */
function printBanner() {
  console.log(`
${COLORS.cyan}${COLORS.bold}╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     QUANTUM TERMINAL DASHBOARD                               ║
║     Development Server                                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝${COLORS.reset}
`);
}

/**
 * Start development servers
 */
async function startDev() {
  printBanner();

  const httpPort = parseInt(process.env.HTTP_PORT || "3000");
  const wsPort = parseInt(process.env.WS_PORT || "3001");

  console.log(`${COLORS.cyan}Starting development servers...${COLORS.reset}\n`);

  // Import and start servers
  const { startServers } = await import("../src/servers/http-server.js");
  const servers = await startServers(httpPort, wsPort);

  console.log(`
${COLORS.green}${COLORS.bold}Development servers running:${COLORS.reset}

  ${COLORS.cyan}Dashboard:${COLORS.reset}  http://localhost:${httpPort}
  ${COLORS.cyan}Terminal:${COLORS.reset}   ws://localhost:${wsPort}/terminal
  ${COLORS.cyan}Health:${COLORS.reset}     http://localhost:${wsPort}/health
  ${COLORS.cyan}Sessions:${COLORS.reset}   http://localhost:${wsPort}/api/sessions

${COLORS.dim}Hot reload is enabled for server-side changes.${COLORS.reset}
${COLORS.dim}For client changes, refresh the browser.${COLORS.reset}

${COLORS.yellow}Press Ctrl+C to stop${COLORS.reset}
`);

  // Watch for file changes (basic hot reload info)
  console.log(
    `${COLORS.dim}Watching for changes in ${ROOT_DIR}/src...${COLORS.reset}\n`,
  );

  // Keep process alive
  process.on("SIGINT", () => {
    console.log(
      `\n${COLORS.cyan}Shutting down development servers...${COLORS.reset}`,
    );
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log(
      `\n${COLORS.cyan}Shutting down development servers...${COLORS.reset}`,
    );
    process.exit(0);
  });
}

/**
 * Run specific script in development mode
 */
async function runScript(scriptName) {
  console.log(`${COLORS.cyan}Running ${scriptName}...${COLORS.reset}\n`);

  switch (scriptName) {
    case "ticker":
      const { start: startTicker } =
        await import("../src/scripts/financial-ticker.js");
      startTicker();
      break;

    case "monitor":
      const { start: startMonitor } =
        await import("../src/scripts/market-monitor.js");
      startMonitor();
      break;

    default:
      console.error(
        `${COLORS.red}Unknown script: ${scriptName}${COLORS.reset}`,
      );
      console.log(`Available scripts: ticker, monitor`);
      process.exit(1);
  }
}

// CLI
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Quantum Terminal Dashboard - Development Server

Usage:
  bun run --hot scripts/start-terminal-dev.js [options]

Options:
  --ticker     Run financial ticker script
  --monitor    Run market monitor script
  --help, -h   Show this help

Environment Variables:
  HTTP_PORT    HTTP server port (default: 3000)
  WS_PORT      WebSocket server port (default: 3001)

Examples:
  # Start development servers
  bun run --hot scripts/start-terminal-dev.js

  # Run ticker in development
  bun run --hot scripts/start-terminal-dev.js --ticker

  # Run with custom ports
  HTTP_PORT=8080 WS_PORT=8081 bun run --hot scripts/start-terminal-dev.js
`);
    process.exit(0);
  }

  if (args.includes("--ticker")) {
    await runScript("ticker");
  } else if (args.includes("--monitor")) {
    await runScript("monitor");
  } else {
    await startDev();
  }
}

export { startDev, runScript };
