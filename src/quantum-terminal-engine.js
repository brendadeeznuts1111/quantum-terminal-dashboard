/**
 * quantum-terminal-engine.js - PTY-Enabled Dashboard Engine
 * Core engine for managing terminals, PTY processes, and feature flags
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Feature flag helper (works both at compile-time and runtime)
const hasFeature = (name) => {
  try {
    // Try compile-time feature check
    if (typeof globalThis.feature === "function") {
      return globalThis.feature(name);
    }
    // Fallback to environment variable
    return process.env[`FEATURE_${name}`] === "true";
  } catch {
    return true; // Default enabled if not in bundled context
  }
};

class QuantumTerminalEngine {
  constructor() {
    this.terminals = new Map();
    this.ptyProcesses = new Map();
    this.terminalOutputs = new Map();
    this.eventListeners = new Map();
    this.initializeTerminalFeatures();
  }

  // INITIALIZE WITH FEATURE FLAGS
  initializeTerminalFeatures() {
    if (!hasFeature("TERMINAL")) {
      console.warn("Terminal features disabled at compile time");
      return;
    }

    console.log("Enabling PTY Terminal Features...");

    // Check platform
    if (process.platform === "win32") {
      console.warn(
        "PTY support is limited on Windows. Please file an issue for full support.",
      );
    }

    // Initialize event types
    ["data", "resize", "exit", "error", "financial:data"].forEach((type) => {
      this.eventListeners.set(type, new Set());
    });
  }

  // EVENT EMITTER
  on(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
  }

  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in event listener for ${event}:`, err);
        }
      });
    }
  }

  // CREATE INTERACTIVE FINANCIAL TERMINAL
  async createFinancialTerminal(options = {}) {
    if (!hasFeature("TERMINAL")) {
      throw new Error("Terminal features not enabled in this build");
    }

    const {
      cols = 80,
      rows = 24,
      command = "bash",
      args = ["-i"],
      cwd = process.cwd(),
      env = { ...process.env, TERM: "xterm-256color" },
    } = options;

    console.log(`Creating financial terminal: ${command} ${args.join(" ")}`);

    const termId = `term_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.terminalOutputs.set(termId, []);

    // Create reusable Bun.Terminal
    // Terminal Methods: write(), resize(), setRawMode(), ref()/unref(), close()
    // Platform: POSIX only (Linux, macOS)
    const terminal = new Bun.Terminal({
      cols,
      rows,
      data: (term, data) => {
        const output = data.toString();

        // Buffer output
        const buffer = this.terminalOutputs.get(termId);
        if (buffer) {
          buffer.push(output);
          if (buffer.length > 1000) buffer.shift();
        }

        // Emit terminal data event
        this.emit("data", {
          terminalId: termId,
          data: output,
          timestamp: Date.now(),
        });

        // Handle terminal output
        this.handleTerminalOutput(term, data);
      },
    });

    // Spawn interactive shell with PTY
    // Note: stdin/stdout/stderr are mutually exclusive with terminal option
    const proc = Bun.spawn([command, ...args], {
      terminal,
      cwd,
      env,
      onExit: (proc, exitCode, signalCode, error) => {
        console.log(`Terminal exited with code ${exitCode}`);
        this.emit("exit", {
          terminalId: termId,
          exitCode,
          signalCode,
          error,
          timestamp: Date.now(),
        });
        this.handleTerminalExit(terminal, exitCode);
      },
    });

    // Store references
    const terminalEntry = { terminal, proc, options, id: termId };
    this.terminals.set(termId, terminalEntry);
    this.ptyProcesses.set(proc.pid, termId);

    return {
      id: termId,
      terminal,
      process: proc,
      write: (data) => terminal.write(data),
      resize: (c, r) => terminal.resize(c, r),
      close: async () => {
        proc.kill();
        await proc.exited;
        terminal.close();
        this.terminals.delete(termId);
        this.ptyProcesses.delete(proc.pid);
        this.terminalOutputs.delete(termId);
      },
    };
  }

  // HANDLE TERMINAL OUTPUT
  handleTerminalOutput(terminal, data) {
    // Override in subclass or via event listener
  }

  // EMIT TERMINAL DATA
  emitTerminalData(terminal, data) {
    // Find terminal ID
    for (const [id, entry] of this.terminals) {
      if (entry.terminal === terminal) {
        this.emit("data", {
          terminalId: id,
          data: data.toString(),
          timestamp: Date.now(),
        });
        break;
      }
    }
  }

  // EMIT TERMINAL RESIZE
  emitTerminalResize(terminal, cols, rows) {
    for (const [id, entry] of this.terminals) {
      if (entry.terminal === terminal) {
        this.emit("resize", {
          terminalId: id,
          cols,
          rows,
          timestamp: Date.now(),
        });
        break;
      }
    }
  }

  // HANDLE TERMINAL EXIT
  handleTerminalExit(terminal, exitCode) {
    // Cleanup will be handled by the close method
  }

  // RUN FINANCIAL VISUALIZATION IN TERMINAL
  async runFinancialVisualization(visualization, options = {}) {
    const {
      type = "ticker",
      symbols = ["AAPL", "GOOGL", "TSLA", "MSFT"],
      interval = "1s",
      terminalCols = 120,
      terminalRows = 40,
    } = options;

    const scriptPath = join(import.meta.dir, "scripts", `${visualization}.js`);

    // Create terminal for financial visualization
    const term = await this.createFinancialTerminal({
      cols: terminalCols,
      rows: terminalRows,
      command: "bun",
      args: ["run", scriptPath],
      env: {
        ...process.env,
        FINANCIAL_SYMBOLS: symbols.join(","),
        UPDATE_INTERVAL: interval,
        VISUALIZATION_TYPE: type,
      },
    });

    return term;
  }

  // GENERATE FINANCIAL VISUALIZATION SCRIPT
  generateFinancialScript(visualization, options) {
    const scripts = {
      ticker: `
        const symbols = process.env.FINANCIAL_SYMBOLS?.split(',') || ['AAPL', 'GOOGL', 'TSLA', 'MSFT'];
        const interval = parseInt(process.env.UPDATE_INTERVAL) || 1000;

        console.log('Quantum Financial Ticker');
        console.log('='.repeat(80));

        setInterval(() => {
          console.clear();
          console.log(\`\${new Date().toISOString()} - Live Market Data\\n\`);

          symbols.forEach(symbol => {
            const price = (Math.random() * 1000).toFixed(2);
            const change = (Math.random() * 20 - 10).toFixed(2);
            const percent = (Math.random() * 5 - 2.5).toFixed(2);
            const color = change >= 0 ? '\\x1b[32m' : '\\x1b[31m';

            console.log(\`\${symbol.padEnd(6)}: $\${price.padStart(8)} \${color}\${change.padStart(7)} (\${percent}%)\\x1b[0m\`);
          });

          console.log('\\n' + '-'.repeat(80));
          console.log('Press Ctrl+C to exit');
        }, interval);
      `,

      htop: `
        const symbols = process.env.FINANCIAL_SYMBOLS?.split(',') || ['AAPL', 'GOOGL', 'TSLA', 'MSFT'];

        console.log('Quantum Trading Process Monitor');
        console.log('='.repeat(100));

        let processId = 1000;
        setInterval(() => {
          console.clear();
          console.log('Quantum Trading Process Monitor - ' + new Date().toISOString());
          console.log('='.repeat(100));
          console.log('PID\\tSYMBOL\\tPRICE\\tVOLUME\\tP&L\\tSTATUS');
          console.log('-'.repeat(100));

          symbols.forEach((symbol, idx) => {
            const pid = processId + idx;
            const price = (Math.random() * 1000).toFixed(2);
            const volume = Math.floor(Math.random() * 1000000);
            const pnl = (Math.random() * 5000 - 2500).toFixed(2);
            const status = Math.random() > 0.5 ? '\\x1b[32mACTIVE\\x1b[0m' : '\\x1b[33mPAUSED\\x1b[0m';

            console.log(\`\${pid}\\t\${symbol}\\t$\${price}\\t\${volume.toLocaleString()}\\t$\${pnl}\\t\${status}\`);
          });

          console.log('\\n' + '-'.repeat(100));
          console.log('F1: Refresh  F2: Add Symbol  F3: Kill Process  F10: Quit');
        }, 2000);
      `,
    };

    return scripts[visualization] || scripts.ticker;
  }

  // PARSE FINANCIAL OUTPUT
  parseFinancialOutput(output, type) {
    try {
      // Try to parse structured data
      const lines = output.split("\n").filter((l) => l.trim());

      // Look for price patterns
      const pricePattern = /(\w+)\s*:\s*\$?([\d.]+)\s*([+-]?[\d.]+)/;

      const data = [];
      for (const line of lines) {
        const match = line.match(pricePattern);
        if (match) {
          data.push({
            symbol: match[1],
            price: parseFloat(match[2]),
            change: parseFloat(match[3]),
          });
        }
      }

      return data.length > 0 ? data : null;
    } catch {
      return null;
    }
  }

  // WEBSOCKET TERMINAL SERVER
  startWebSocketTerminalServer(port = 3001) {
    if (!hasFeature("TERMINAL")) return null;

    const engine = this;

    const server = Bun.serve({
      port,
      fetch(req, server) {
        const url = new URL(req.url);

        // Handle WebSocket upgrade for terminal connections
        if (url.pathname === "/terminal") {
          const success = server.upgrade(req, {
            data: {
              terminal: null,
              createdAt: Date.now(),
            },
          });

          if (success) return undefined;
        }

        // Health check
        if (url.pathname === "/health") {
          return Response.json({
            status: "ok",
            terminals: engine.terminals.size,
            uptime: process.uptime(),
          });
        }

        return new Response("Quantum Terminal Server");
      },
      websocket: {
        async open(ws) {
          console.log("WebSocket terminal connection opened");

          // Create terminal for this WebSocket connection
          const term = await engine.createFinancialTerminal({
            cols: 80,
            rows: 24,
            command: "bash",
            args: ["-i"],
          });

          ws.data.terminal = term;

          // Forward terminal output to WebSocket
          engine.on("data", (event) => {
            if (
              event.terminalId === term.id &&
              ws.readyState === WebSocket.OPEN
            ) {
              ws.send(
                JSON.stringify({
                  type: "terminal_data",
                  data: event.data,
                  timestamp: event.timestamp,
                }),
              );
            }
          });

          // Send initial greeting
          term.terminal.write('echo "Welcome to Quantum Financial Terminal"\n');
          term.terminal.write("echo \"Type 'help' for available commands\"\n");
        },

        async message(ws, message) {
          const term = ws.data.terminal;
          if (!term) return;

          try {
            const data = JSON.parse(message.toString());

            switch (data.type) {
              case "terminal_input":
                term.terminal.write(data.data);
                break;

              case "terminal_resize":
                term.terminal.resize(data.cols, data.rows);
                break;

              case "terminal_command":
                const cmd = data.command;
                if (cmd.startsWith("quantum.")) {
                  await engine.handleQuantumCommand(term, cmd);
                } else {
                  term.terminal.write(cmd + "\n");
                }
                break;
            }
          } catch {
            // Treat as raw input
            term.terminal.write(message.toString());
          }
        },

        close(ws) {
          console.log("WebSocket terminal connection closed");
          const term = ws.data.terminal;
          if (term) {
            term.close().catch(console.error);
          }
        },
      },
    });

    console.log(
      `Terminal WebSocket server running on ws://localhost:${server.port}/terminal`,
    );
    return server;
  }

  // HANDLE QUANTUM COMMANDS
  async handleQuantumCommand(term, command) {
    const parts = command.split(".");
    const cmd = parts[1];

    switch (cmd) {
      case "ticker":
        term.terminal.write('echo "Starting Quantum Ticker..."\n');
        term.terminal.write(
          `bun run ${join(import.meta.dir, "scripts/financial-ticker.js")}\n`,
        );
        break;

      case "monitor":
        term.terminal.write('echo "Starting Market Monitor..."\n');
        term.terminal.write(
          `bun run ${join(import.meta.dir, "scripts/market-monitor.js")}\n`,
        );
        break;

      case "status":
        const stats = {
          activeTerminals: this.terminals.size,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        };
        term.terminal.write(`echo '${JSON.stringify(stats, null, 2)}'\n`);
        break;

      case "clear":
        term.terminal.write("clear\n");
        break;

      case "help":
        const helpText = `
Quantum Terminal Commands:
  quantum.ticker  - Start financial ticker
  quantum.monitor - Start market monitor (htop-style)
  quantum.status  - Show server status
  quantum.clear   - Clear terminal
  quantum.help    - Show this help
`;
        term.terminal.write(`echo '${helpText.replace(/'/g, "\\'")}'\n`);
        break;

      default:
        term.terminal.write(`echo "Unknown quantum command: ${cmd}"\n`);
    }
  }

  // COMPILE-TIME FEATURE FLAG INTEGRATION
  async buildWithFeatureFlags(options = {}) {
    const {
      entrypoints = ["./src/quantum-app.ts"],
      outdir = "./dist",
      features = ["TERMINAL", "WEBGL", "PREMIUM"],
      terminalEnabled = true,
    } = options;

    // Feature flag validation
    const validatedFeatures = features.filter((f) => {
      if (f === "TERMINAL" && !terminalEnabled) return false;
      return true;
    });

    console.log(`Building with features: ${validatedFeatures.join(", ")}`);

    const result = await Bun.build({
      entrypoints,
      outdir,
      define: {
        "globalThis.QUANTUM_FEATURES": JSON.stringify(validatedFeatures),
        "process.env.ENABLE_TERMINAL": JSON.stringify(terminalEnabled),
        "process.env.BUILD_TIMESTAMP": JSON.stringify(Date.now()),
      },
      minify: true,
      sourcemap: "external",
    });

    // Generate feature report
    await this.generateFeatureReport(result, validatedFeatures);

    return result;
  }

  // GENERATE FEATURE REPORT
  async generateFeatureReport(result, features) {
    const report = {
      timestamp: new Date().toISOString(),
      features,
      outputs:
        result.outputs?.map((o) => ({
          path: o.path,
          size: o.size,
          kind: o.kind,
        })) || [],
      success: result.success,
    };

    // Use Bun.inspect with sorted properties for consistent output
    console.log(
      "Feature Report:",
      Bun.inspect(report, { sorted: true, depth: 10 }),
    );
    return report;
  }

  // FEATURE-SPECIFIC CODE GENERATION
  generateTerminalComponent() {
    if (!hasFeature("TERMINAL")) {
      return `
        // Terminal features disabled at compile time
        export const TerminalComponent = () => (
          <div className="terminal-disabled">
            <p>Terminal features are not available in this build.</p>
            <p>Recompile with --feature=TERMINAL to enable.</p>
          </div>
        );
      `;
    }

    return `
      import React, { useEffect, useRef, useState } from 'react';

      export const QuantumTerminal = ({ onData, onResize, theme = 'quantum' }) => {
        const terminalRef = useRef(null);
        const termInstance = useRef(null);
        const [connected, setConnected] = useState(false);
        const [dimensions, setDimensions] = useState({ cols: 80, rows: 24 });

        useEffect(() => {
          if (!terminalRef.current) return;

          // Dynamic import xterm.js
          import('xterm').then(({ Terminal }) => {
            import('xterm-addon-fit').then(({ FitAddon }) => {
              termInstance.current = new Terminal({
                theme: {
                  background: '#000010',
                  foreground: '#00f0ff',
                  cursor: '#9d00ff',
                  selection: 'rgba(0, 240, 255, 0.3)'
                },
                fontSize: 14,
                fontFamily: 'Monaco, "Courier New", monospace',
                cursorBlink: true,
                cols: dimensions.cols,
                rows: dimensions.rows
              });

              const fitAddon = new FitAddon();
              termInstance.current.loadAddon(fitAddon);
              termInstance.current.open(terminalRef.current);
              fitAddon.fit();

              // Connect to WebSocket terminal server
              const ws = new WebSocket('ws://localhost:3001/terminal');

              ws.onopen = () => {
                setConnected(true);
                termInstance.current.writeln('\\x1b[32mConnected to Quantum Terminal\\x1b[0m');
              };

              ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'terminal_data') {
                  termInstance.current.write(data.data);
                }
              };

              termInstance.current.onData((data) => {
                ws.send(JSON.stringify({ type: 'terminal_input', data }));
              });
            });
          });

          return () => termInstance.current?.dispose();
        }, []);

        return (
          <div className="quantum-terminal">
            <div className="terminal-header">
              <span style={{ color: connected ? '#00ff41' : '#ff0033' }}>
                {connected ? 'Connected' : 'Disconnected'}
              </span>
              <span>{dimensions.cols}x{dimensions.rows}</span>
            </div>
            <div ref={terminalRef} className="terminal-container" />
          </div>
        );
      };
    `;
  }

  // GET STATISTICS
  getStats() {
    return {
      activeTerminals: this.terminals.size,
      activePTYs: this.ptyProcesses.size,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  // CLOSE ALL TERMINALS
  async closeAll() {
    const closePromises = [];
    for (const [id, entry] of this.terminals) {
      closePromises.push(
        (async () => {
          try {
            entry.proc.kill();
            await entry.proc.exited;
            entry.terminal.close();
          } catch (err) {
            console.error(`Error closing terminal ${id}:`, err);
          }
        })(),
      );
    }
    await Promise.all(closePromises);
    this.terminals.clear();
    this.ptyProcesses.clear();
    this.terminalOutputs.clear();
  }
}

// Store global reference for WebSocket handlers
globalThis.QUANTUM_TERMINAL_ENGINE = null;

// CLI INTERFACE WITH TERMINAL SUPPORT
if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const engine = new QuantumTerminalEngine();
  globalThis.QUANTUM_TERMINAL_ENGINE = engine;

  if (args.includes("--terminal") || args.includes("--server")) {
    console.log("Starting Quantum Terminal Dashboard...");

    // Start WebSocket terminal server
    const wsServer = engine.startWebSocketTerminalServer(3001);

    // Start HTTP server for dashboard
    const httpServer = Bun.serve({
      port: 3000,
      async fetch(req) {
        const url = new URL(req.url);

        if (url.pathname === "/") {
          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Quantum Terminal Dashboard</title>
              <style>
                body { margin: 0; background: #000010; color: #00f0ff; font-family: monospace; }
                .dashboard { display: flex; height: 100vh; }
                .terminal-pane { flex: 1; border-right: 1px solid #00f0ff33; }
                h1 { padding: 20px; margin: 0; border-bottom: 1px solid #00f0ff33; }
              </style>
            </head>
            <body>
              <h1>Quantum Terminal Dashboard</h1>
              <p style="padding: 20px;">
                Terminal WebSocket: ws://localhost:${wsServer?.port}/terminal<br>
                HTTP Server: http://localhost:3000
              </p>
            </body>
            </html>
          `;
          return new Response(html, {
            headers: { "Content-Type": "text/html" },
          });
        }

        return new Response("Not found", { status: 404 });
      },
    });

    console.log(`Dashboard running on http://localhost:${httpServer.port}`);
    console.log(
      `Terminal WebSocket: ws://localhost:${wsServer?.port}/terminal`,
    );
  } else if (args.includes("--run-pty")) {
    console.log("Testing Bun.Terminal API...");

    const term = await engine.createFinancialTerminal({
      cols: 80,
      rows: 24,
      command: "bash",
      args: ["-c", 'echo "Hello from PTY"; ls -la; echo "Done"'],
    });

    await term.process.exited;
    await term.close();
  } else if (args.includes("--help")) {
    console.log(`
Quantum Terminal Engine

Usage:
  bun run quantum-terminal-engine.js [options]

Options:
  --terminal, --server   Start terminal dashboard servers
  --run-pty              Test PTY API
  --help                 Show this help
`);
  } else {
    console.log("Use --terminal to start servers or --help for options");
  }
}

export { QuantumTerminalEngine, hasFeature };
