/**
 * http-server.js - Main HTTP Server for Quantum Dashboard
 * Serves the React dashboard with hot reload support
 */

import { startTerminalServer } from "./terminal-server.js";

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quantum Financial Dashboard</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.min.css">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body, #root {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    body {
      background: #000010;
      color: #00f0ff;
      font-family: Monaco, "Cascadia Code", "Fira Code", Consolas, monospace;
    }

    /* Loading state */
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 20px;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #00f0ff33;
      border-top-color: #00f0ff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Terminal styles */
    .xterm {
      padding: 8px;
    }

    .xterm-viewport::-webkit-scrollbar {
      width: 8px;
    }

    .xterm-viewport::-webkit-scrollbar-track {
      background: #000020;
    }

    .xterm-viewport::-webkit-scrollbar-thumb {
      background: #00f0ff33;
      border-radius: 4px;
    }

    .xterm-viewport::-webkit-scrollbar-thumb:hover {
      background: #00f0ff66;
    }

    /* Custom cursor effect */
    .quantum-cursor {
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="loading">
      <div class="loading-spinner"></div>
      <div>Loading Quantum Dashboard...</div>
    </div>
  </div>

  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@18.2.0",
      "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
      "xterm": "https://esm.sh/xterm@5.3.0",
      "xterm-addon-fit": "https://esm.sh/xterm-addon-fit@0.8.0",
      "xterm-addon-web-links": "https://esm.sh/xterm-addon-web-links@0.9.0"
    }
  }
  </script>

  <script type="module">
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import { Terminal } from 'xterm';
    import { FitAddon } from 'xterm-addon-fit';

    // Simple inline dashboard for development
    const { useState, useEffect, useRef, useCallback } = React;
    const e = React.createElement;

    // Theme
    const theme = {
      background: '#000010',
      foreground: '#00f0ff',
      cursor: '#9d00ff',
      accent: '#00ff41',
      error: '#ff3366'
    };

    // WebSocket Terminal Component
    function QuantumTerminal({ onData, onConnect, onDisconnect }) {
      const termRef = useRef(null);
      const termInstance = useRef(null);
      const wsRef = useRef(null);
      const [connected, setConnected] = useState(false);
      const [dimensions, setDimensions] = useState({ cols: 80, rows: 24 });

      useEffect(() => {
        if (!termRef.current) return;

        // Initialize xterm
        const term = new Terminal({
          theme: {
            background: theme.background,
            foreground: theme.foreground,
            cursor: theme.cursor,
            selectionBackground: 'rgba(0, 240, 255, 0.3)'
          },
          fontSize: 14,
          fontFamily: 'Monaco, "Cascadia Code", Consolas, monospace',
          cursorBlink: true,
          cols: 80,
          rows: 24,
          scrollback: 5000
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(termRef.current);
        fitAddon.fit();

        termInstance.current = term;

        // Welcome message
        term.writeln('\\x1b[36m=== Quantum Financial Terminal ===\\x1b[0m');
        term.writeln('\\x1b[90mConnecting to server...\\x1b[0m');
        term.writeln('');

        // Connect WebSocket
        const ws = new WebSocket('wss://api.example.com/terminal');
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          term.writeln('\\x1b[32m[Connected]\\x1b[0m');
          term.writeln('Type \\x1b[33mquantum.help\\x1b[0m for commands');
          term.writeln('');
          onConnect?.();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'terminal_data') {
              term.write(data.data);
              onData?.(data.data);
            }
          } catch {
            term.write(event.data);
          }
        };

        ws.onclose = () => {
          setConnected(false);
          term.writeln('\\n\\x1b[31m[Disconnected]\\x1b[0m');
          onDisconnect?.();
        };

        // Handle input
        term.onData((data) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'terminal_input',
              data,
              timestamp: Date.now()
            }));
          }
        });

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
          fitAddon.fit();
          const dims = { cols: term.cols, rows: term.rows };
          setDimensions(dims);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'terminal_resize', ...dims }));
          }
        });
        resizeObserver.observe(termRef.current);

        return () => {
          ws.close();
          term.dispose();
          resizeObserver.disconnect();
        };
      }, []);

      return e('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: theme.background,
          border: '1px solid ' + theme.foreground + '33',
          borderRadius: '8px',
          overflow: 'hidden'
        }
      }, [
        // Header
        e('div', {
          key: 'header',
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            backgroundColor: theme.foreground + '11',
            borderBottom: '1px solid ' + theme.foreground + '33'
          }
        }, [
          e('div', {
            key: 'status',
            style: { display: 'flex', alignItems: 'center', gap: '8px' }
          }, [
            e('span', {
              key: 'dot',
              style: {
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: connected ? theme.accent : theme.error,
                boxShadow: connected ? '0 0 8px ' + theme.accent : 'none'
              }
            }),
            e('span', {
              key: 'title',
              style: { color: theme.foreground, fontWeight: 'bold' }
            }, 'Quantum Terminal')
          ]),
          e('span', {
            key: 'dims',
            style: { color: theme.foreground + '88', fontSize: '12px' }
          }, dimensions.cols + 'x' + dimensions.rows)
        ]),
        // Terminal
        e('div', {
          key: 'term',
          ref: termRef,
          style: { flex: 1, padding: '8px' }
        }),
        // Footer
        e('div', {
          key: 'footer',
          style: {
            padding: '6px 12px',
            backgroundColor: theme.foreground + '11',
            borderTop: '1px solid ' + theme.foreground + '33',
            fontSize: '11px',
            color: theme.foreground + '88'
          }
        }, 'Ctrl+C interrupt | Ctrl+D exit | quantum.help for commands')
      ]);
    }

    // Main App
    function App() {
      const [terminalConnected, setTerminalConnected] = useState(false);

      return e('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          backgroundColor: theme.background,
          color: theme.foreground
        }
      }, [
        // Header
        e('header', {
          key: 'header',
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            borderBottom: '1px solid ' + theme.foreground + '33',
            background: 'linear-gradient(90deg, #000020, #000010)'
          }
        }, [
          e('div', {
            key: 'title',
            style: { display: 'flex', alignItems: 'center', gap: '12px' }
          }, [
            e('span', { key: 'icon', style: { fontSize: '24px' } }, 'Q'),
            e('div', { key: 'text' }, [
              e('h1', {
                key: 'h1',
                style: { margin: 0, fontSize: '18px', fontWeight: 'bold' }
              }, 'Quantum Financial Dashboard'),
              e('span', {
                key: 'version',
                style: { fontSize: '11px', color: theme.foreground + '88' }
              }, 'PTY Terminal Integration v1.4.0')
            ])
          ]),
          e('div', {
            key: 'features',
            style: { display: 'flex', gap: '8px' }
          }, ['PTY', 'WebGL', 'Premium'].map(feat =>
            e('span', {
              key: feat,
              style: {
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: theme.foreground + '11',
                border: '1px solid ' + theme.foreground + '33',
                fontSize: '11px'
              }
            }, feat + ' \\u2713')
          ))
        ]),
        // Main content
        e('main', {
          key: 'main',
          style: { flex: 1, padding: '20px', overflow: 'hidden' }
        }, [
          e(QuantumTerminal, {
            key: 'terminal',
            onConnect: () => setTerminalConnected(true),
            onDisconnect: () => setTerminalConnected(false)
          })
        ]),
        // Footer
        e('footer', {
          key: 'footer',
          style: {
            padding: '8px 20px',
            borderTop: '1px solid ' + theme.foreground + '22',
            fontSize: '11px',
            color: theme.foreground + '66'
          }
        }, 'Quantum Terminal Dashboard v1.4.0-pty.alpha.1 | Terminal: ' +
           (terminalConnected ? 'Connected' : 'Disconnected'))
      ]);
    }

    // Mount app
    const root = createRoot(document.getElementById('root'));
    root.render(e(App));
  </script>
</body>
</html>`;

/**
 * Start the HTTP server
 */
function startHttpServer(port = 3000) {
  const server = Bun.serve({
    port,

    async fetch(req) {
      const url = new URL(req.url);

      // Serve main dashboard
      if (url.pathname === "/" || url.pathname === "/index.html") {
        return new Response(HTML_TEMPLATE, {
          headers: { "Content-Type": "text/html" },
        });
      }

      // Health check
      if (url.pathname === "/health") {
        return Response.json({
          status: "ok",
          server: "http",
          uptime: process.uptime(),
        });
      }

      // API: Server info
      if (url.pathname === "/api/info") {
        return Response.json({
          name: "Quantum Financial Dashboard",
          version: "1.4.0-pty.alpha.1",
          features: ["TERMINAL", "WEBGL", "PREMIUM"],
          endpoints: {
            dashboard: "https://dashboard.example.com",
            terminal: "wss://api.example.com/terminal",
            health: "https://api.example.com/health",
          },
        });
      }

      // Static files from dist (if built)
      if (url.pathname.startsWith("/dist/")) {
        const filePath = "." + url.pathname;
        const file = Bun.file(filePath);
        if (await file.exists()) {
          return new Response(file);
        }
      }

      return new Response("Not Found", { status: 404 });
    },
  });

  console.log(
    `Quantum Dashboard HTTP Server running on https://dashboard.example.com:${server.port}`,
  );
  return server;
}

/**
 * Start both servers
 */
async function startServers(httpPort = 3000, wsPort = 3001) {
  console.log("Starting Quantum Terminal Dashboard servers...\n");

  // Start terminal WebSocket server
  const wsServer = startTerminalServer(wsPort);

  // Start HTTP server
  const httpServer = startHttpServer(httpPort);

  console.log("\nDashboard ready:");
  console.log(`  Open https://dashboard.example.com:${httpPort} in your browser`);
  console.log("\nPress Ctrl+C to stop\n");

  return { httpServer, wsServer };
}

// Start if run directly
if (import.meta.main) {
  const httpPort = parseInt(process.env.HTTP_PORT || "3000");
  const wsPort = parseInt(process.env.WS_PORT || "3001");
  startServers(httpPort, wsPort);
}

export { startHttpServer, startServers, HTML_TEMPLATE };
