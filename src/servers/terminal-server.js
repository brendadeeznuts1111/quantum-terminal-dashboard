/**
 * terminal-server.js - Bun.Terminal WebSocket Server
 * Handles PTY terminal connections for the dashboard
 */

// Terminal session storage
const terminalSessions = new Map();
const sessionOutputBuffers = new Map();

/**
 * Create a PTY terminal for a WebSocket connection
 */
async function createTerminalSession(ws, config = {}) {
  const {
    cols = 80,
    rows = 24,
    command = "bash",
    args = ["-i"],
    cwd = process.cwd(),
    env = { ...process.env, TERM: "xterm-256color" },
  } = config;

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionOutputBuffers.set(sessionId, []);

  // Create reusable Bun.Terminal
  // Terminal Methods: write(), resize(), setRawMode(), ref()/unref(), close()
  // Platform: POSIX only (Linux, macOS)
  const terminal = new Bun.Terminal({
    cols,
    rows,
    data(term, data) {
      const output = data.toString();

      // Buffer output
      const buffer = sessionOutputBuffers.get(sessionId);
      if (buffer) {
        buffer.push(output);
        if (buffer.length > 500) buffer.shift();
      }

      // Send to WebSocket
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "terminal_data",
            data: output,
            sessionId,
            timestamp: Date.now(),
          }),
        );
      }
    },
  });

  // Spawn process with PTY
  const proc = Bun.spawn([command, ...args], {
    terminal,
    cwd,
    env,
    onExit(proc, exitCode, signalCode, error) {
      console.log(`[${sessionId}] Process exited with code ${exitCode}`);

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "terminal_exit",
            exitCode,
            sessionId,
            timestamp: Date.now(),
          }),
        );
      }

      // Cleanup
      terminalSessions.delete(sessionId);
      sessionOutputBuffers.delete(sessionId);
    },
  });

  const session = {
    id: sessionId,
    terminal,
    process: proc,
    ws,
    config,
    createdAt: Date.now(),
    write(data) {
      terminal.write(data);
    },
    resize(cols, rows) {
      terminal.resize(cols, rows);
    },
    async close() {
      proc.kill();
      await proc.exited;
      terminal.close();
      terminalSessions.delete(sessionId);
      sessionOutputBuffers.delete(sessionId);
    },
  };

  terminalSessions.set(sessionId, session);
  return session;
}

/**
 * Handle quantum-specific commands
 */
async function handleQuantumCommand(session, command) {
  const parts = command.split(".");
  const cmd = parts[1];

  switch (cmd) {
    case "ticker":
      session.terminal.write('echo "Starting Quantum Ticker..."\n');
      session.terminal.write(
        `node ${process.cwd()}/src/scripts/financial-ticker.js\n`,
      );
      break;

    case "monitor":
      session.terminal.write('echo "Starting Market Monitor..."\n');
      session.terminal.write(
        `node ${process.cwd()}/src/scripts/market-monitor.js\n`,
      );
      break;

    case "status":
      const stats = {
        activeSessions: terminalSessions.size,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      };
      session.terminal.write(`echo '${JSON.stringify(stats, null, 2)}'\n`);
      break;

    case "clear":
      session.terminal.write("clear\n");
      break;

    case "help":
      const helpText = `
Quantum Terminal Commands:
  quantum.ticker  - Start financial ticker
  quantum.monitor - Start market monitor (htop-style)
  quantum.status  - Show server status
  quantum.clear   - Clear terminal
  quantum.help    - Show this help

Standard bash commands also work.
`;
      session.terminal.write(`echo '${helpText.replace(/'/g, "\\'")}'\n`);
      break;

    default:
      session.terminal.write(`echo "Unknown quantum command: ${cmd}"\n`);
  }
}

/**
 * Start the WebSocket terminal server
 */
function startTerminalServer(port = 3001) {
  const server = Bun.serve({
    port,

    fetch(req, server) {
      const url = new URL(req.url);

      // WebSocket upgrade for terminal
      if (url.pathname === "/terminal") {
        const upgraded = server.upgrade(req, {
          data: {
            sessionId: null,
            createdAt: Date.now(),
          },
        });

        if (upgraded) return undefined;
        return new Response("WebSocket upgrade failed", { status: 400 });
      }

      // Health check
      if (url.pathname === "/health") {
        return Response.json({
          status: "ok",
          activeSessions: terminalSessions.size,
          uptime: process.uptime(),
        });
      }

      // API: List sessions
      if (url.pathname === "/api/sessions") {
        const sessions = Array.from(terminalSessions.values()).map((s) => ({
          id: s.id,
          createdAt: s.createdAt,
          config: s.config,
        }));
        return Response.json({ sessions });
      }

      // API: Get session output buffer
      if (url.pathname.startsWith("/api/buffer/")) {
        const sessionId = url.pathname.split("/").pop();
        const buffer = sessionOutputBuffers.get(sessionId);
        if (buffer) {
          return Response.json({ sessionId, output: buffer });
        }
        return Response.json({ error: "Session not found" }, { status: 404 });
      }

      return new Response(
        "Quantum Terminal Server\n\nEndpoints:\n- ws://localhost:3001/terminal\n- GET /health\n- GET /api/sessions\n- GET /api/buffer/:sessionId",
      );
    },

    websocket: {
      async open(ws) {
        console.log("WebSocket connection opened");

        // Create terminal session
        const session = await createTerminalSession(ws, {
          cols: 80,
          rows: 24,
        });

        ws.data.sessionId = session.id;

        // Send welcome message
        ws.send(
          JSON.stringify({
            type: "session_created",
            sessionId: session.id,
            timestamp: Date.now(),
          }),
        );

        // Write initial prompt
        session.terminal.write(
          'echo "Welcome to Quantum Financial Terminal"\n',
        );
        session.terminal.write(
          'echo "Type quantum.help for available commands"\n',
        );
        session.terminal.write('echo ""\n');
      },

      async message(ws, message) {
        const session = terminalSessions.get(ws.data.sessionId);
        if (!session) return;

        try {
          const data = JSON.parse(message.toString());

          switch (data.type) {
            case "terminal_input":
              session.terminal.write(data.data);
              break;

            case "terminal_resize":
              session.terminal.resize(data.cols, data.rows);
              break;

            case "terminal_command":
              if (data.command.startsWith("quantum.")) {
                await handleQuantumCommand(session, data.command);
              } else {
                session.terminal.write(data.command + "\n");
              }
              break;

            case "config":
              // Update session configuration
              if (data.symbols) {
                session.config.symbols = data.symbols;
              }
              break;

            default:
              console.warn("Unknown message type:", data.type);
          }
        } catch (err) {
          // Treat as raw input
          session.terminal.write(message.toString());
        }
      },

      close(ws) {
        console.log("WebSocket connection closed");

        const session = terminalSessions.get(ws.data.sessionId);
        if (session) {
          session.close().catch(console.error);
        }
      },

      error(ws, error) {
        console.error("WebSocket error:", error);
      },
    },
  });

  console.log(`Quantum Terminal Server running on:`);
  console.log(`  WebSocket: ws://localhost:${server.port}/terminal`);
  console.log(`  Health:    http://localhost:${server.port}/health`);
  console.log(`  Sessions:  http://localhost:${server.port}/api/sessions`);

  return server;
}

// Start server if run directly
if (import.meta.main) {
  const port = parseInt(process.env.PORT || "3001");
  startTerminalServer(port);
}

export { startTerminalServer, createTerminalSession, terminalSessions };
