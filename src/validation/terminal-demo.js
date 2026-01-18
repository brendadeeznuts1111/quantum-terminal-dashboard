"use strict";

/**
 * terminal-demo.js - Interactive Terminal Demo System
 * Provides live demonstrations of quantum terminal capabilities
 */

export class QuantumTerminalDemo {
  constructor() {
    this.terminals = new Map();
    this.demoScripts = this.loadDemoScripts();
    this.activeDemos = new Set();
    this._tempFileHandle = null; // Re-use single Bun.file() handle
    this._resizeTimeout = null; // Debounce resize events

    // Freeze enum-like objects for JSC optimization
    this.DEMO_TYPES = Object.freeze({
      MARKET_TICKER: "market-ticker",
      TENSION_MONITOR: "tension-monitor",
      NETWORK_VISUALIZER: "network-visualizer",
    });

    this.TERMINAL_SIZE = Object.freeze({
      DEFAULT_COLS: 100,
      DEFAULT_ROWS: 30,
      DEBOUNCE_MS: 16,
    });
  }

  loadDemoScripts() {
    return {
      "market-ticker": `#!/bin/bash
clear
echo "📈 Quantum Financial Terminal v1.5.0"
echo "====================================="
echo ""

symbols=("AAPL" "GOOGL" "TSLA" "MSFT" "AMZN" "NVDA")

trap 'echo ""; echo "📤 Market ticker stopped"; exit 0' INT TERM

while true; do
  clear
  echo "QUANTUM MARKET DATA - $(date '+%H:%M:%S')"
  echo "-------------------------------------"
  echo ""
  
  for symbol in "\${symbols[@]}"; do
    price=\$((RANDOM % 500 + 100)).\$((RANDOM % 100))
    change=\$((RANDOM % 50 - 25)).\$((RANDOM % 100))
    
    if [ \$change -ge 0 ]; then
      sign="+"
    else
      sign=""
    fi
    
    volume=\$((RANDOM % 900000 + 100000))
    printf "%-8s \$%-10.2f %s%+7.2f (%+6.2f%%) %10d\\n" "\$symbol" "\$price" "\$sign" "\$change" "\$change" "\$volume"
  done
  
  echo ""
  echo "-------------------------------------"
  echo "• Press Ctrl+C to exit • Updated every second"
  echo "🔗 Quantum Engine: SIMD Accelerated"
  
  sleep 1
done`,

      "tension-monitor": `#!/bin/bash
clear
echo "⚡ Quantum Tension Engine Monitor"
echo "================================"
echo ""

components=("Terminal" "Renderer" "Data" "Network" "Cache" "Memory" "CPU" "Storage")

trap 'echo ""; echo "⏹️ Tension monitor stopped"; exit 0' INT TERM

counter=0
while true; do
  clear
  echo "TENSION LEVELS - $(date '+%H:%M:%S')"
  echo "------------------------"
  echo ""
  
  total_tension=0
  for component in "\${components[@]}"; do
    tension=\$((RANDOM % 100))
    total_tension=\$((total_tension + tension))
    
    # Create bar
    bar=""
    for ((i=0; i<30; i++)); do
      if [ \$i -lt \$((tension * 30 / 100)) ]; then
        bar="\${bar}█"
      else
        bar="\${bar}░"
      fi
    done
    
    printf "%-12s [%s] %3d%%\\n" "\$component" "\$bar" "\$tension"
  done
  
  avg_tension=\$((total_tension / \${#components[@]}))
  
  echo ""
  echo "------------------------"
  printf "System:     %3d%%\\n" "\$avg_tension"
  printf "Decay Rate: 2.0%%\\n"
  printf "Components: %d active\\n" "\${#components[@]}"
  
  echo ""
  echo "• Press Ctrl+C to exit • Real-time quantum tension monitoring"
  echo "🔧 Decay Engine: Active • Analytics: Recording"
  
  ((counter++))
  sleep 1
done`,

      "network-visualizer": `#!/bin/bash
clear
echo "🕸️  Quantum Network Visualization"
echo "================================"
echo ""

nodes=("ALPHA" "BETA" "GAMMA" "DELTA" "EPSILON" "ZETA" "ETA" "THETA")

trap 'echo ""; echo "📤 Network visualizer stopped"; exit 0' INT TERM

counter=0
while true; do
  clear
  echo "NETWORK TOPOLOGY - $(date '+%H:%M:%S')"
  echo "---------------------------"
  echo ""
  
  total_connections=0
  total_latency=0
  
  for node in "\${nodes[@]}"; do
    connections=\$((RANDOM % 15 + 5))
    latency=\$((RANDOM % 50 + 5))
    throughput=\$((RANDOM % 1000 + 100))
    
    total_connections=\$((total_connections + connections))
    total_latency=\$((total_latency + latency))
    
    # Status indicator
    if [ \$latency -lt 20 ] && [ \$connections -gt 8 ]; then
      status="🟢"
    elif [ \$latency -lt 40 ] && [ \$connections -gt 4 ]; then
      status="🟡"
    else
      status="🔴"
    fi
    
    # Format throughput
    if [ \$throughput -gt 1000 ]; then
      throughput_disp="\$((throughput / 1000))G"
    else
      throughput_disp="\${throughput}M"
    fi
    
    printf "%s %-8s %3d conn %3d ms %s\\n" "\$status" "\$node" "\$connections" "\$latency" "\$throughput_disp"
  done
  
  avg_latency=\$((total_latency / \${#nodes[@]}))
  
  echo ""
  echo "---------------------------"
  printf "Total:       %d connections\\n" "\$total_connections"
  printf "Avg Latency: %d ms\\n" "\$avg_latency"
  printf "Throughput:  %d Mbps\\n" "\$((total_throughput / \${#nodes[@]}))"
  
  echo ""
  echo "• Press Ctrl+C to exit • Network topology updates every 2 seconds"
  echo "🔗 Quantum Protocol: Active • Mesh Routing: Enabled"
  
  ((counter++))
  sleep 2
done`,
    };
  }

  async startDemo(demoName, options = {}) {
    if (!Bun.Terminal) {
      throw new Error("Bun.Terminal API not available in this environment");
    }

    const script = this.demoScripts[demoName];
    if (!script) {
      throw new Error(
        `Unknown demo: ${demoName}. Available: ${Object.keys(this.demoScripts).join(", ")}`,
      );
    }

    if (this.activeDemos.has(demoName)) {
      throw new Error(`Demo ${demoName} is already running`);
    }

    console.log(`🚀 Starting ${demoName} demo...`);
    Bun.stdout.write("Press Ctrl+C to exit\n\n");

    // Create terminal with Bun.Terminal
    await using terminal = new Bun.Terminal({
      cols: options.cols || 100,
      rows: options.rows || 30,
      data: (term, data) => {
        process.stdout.write(data);
      },
    });

    // Write the demo script to a temporary file with explicit UTF-8 encoding
    const scriptPath = `/tmp/quantum-demo-${demoName}-${Date.now()}.sh`;
    await Bun.write(scriptPath, script, "utf-8"); // Removes internal encoding probe

    // Make script executable
    await Bun.spawn(["chmod", "+x", scriptPath]).exited;

    // Execute with bash
    const proc = Bun.spawn(["bash", scriptPath], {
      terminal,
      env: {
        ...process.env,
        TERM: "xterm-256color",
        COLUMNS: options.cols || 100,
        LINES: options.rows || 30,
      },
      onExit: (proc, code, signal, error) => {
        Bun.stdout.write(`\n📤 Demo ${demoName} exited with code ${code}\n`);
        this.activeDemos.delete(demoName);
        terminal.close();
      },
    });

    // Handle resize events with 16ms debounce (matches 60 FPS)
    const handleResize = () => {
      if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
      this._resizeTimeout = setTimeout(() => {
        const newCols =
          process.stdout.columns || this.TERMINAL_SIZE.DEFAULT_COLS;
        const newRows = process.stdout.rows || this.TERMINAL_SIZE.DEFAULT_ROWS;
        terminal.resize(newCols, newRows);
      }, this.TERMINAL_SIZE.DEBOUNCE_MS);
    };

    process.stdout.on("resize", handleResize);

    // Handle input
    process.stdin.setRawMode(true);
    const handleInput = (data) => {
      if (data.toString() === "\u0003") {
        // Ctrl+C
        proc.kill();
        process.stdin.setRawMode(false);
        process.stdin.off("data", handleInput);
        process.stdout.off("resize", handleResize);
      } else {
        terminal.write(data);
      }
    };

    process.stdin.on("data", handleInput);

    this.activeDemos.add(demoName);
    this.terminals.set(demoName, {
      terminal,
      proc,
      scriptPath,
      startTime: Date.now(),
    });

    // Wait for process to exit
    await proc.exited;

    // Cleanup
    try {
      await Bun.file(scriptPath).delete();
    } catch (e) {
      // Ignore cleanup errors
    }
    this.terminals.delete(demoName);

    return {
      exitCode: proc.exitCode,
      signal: proc.signalCode,
      duration:
        Date.now() - (this.terminals.get(demoName)?.startTime || Date.now()),
    };
  }

  async stopDemo(demoName) {
    const terminalInfo = this.terminals.get(demoName);
    if (!terminalInfo) {
      throw new Error(`Demo ${demoName} is not running`);
    }

    console.log(`🛑 Stopping ${demoName} demo...`);
    terminalInfo.proc.kill();
    this.activeDemos.delete(demoName);

    return { demo: demoName, stopped: true };
  }

  async listDemos() {
    return Object.keys(this.demoScripts).map((name) => ({
      name,
      description: this.getDemoDescription(name),
      estimatedRuntime: "infinite (Ctrl+C to exit)",
      features: this.getDemoFeatures(name),
      status: this.activeDemos.has(name) ? "running" : "available",
    }));
  }

  getDemoDescription(name) {
    const descriptions = Object.freeze({
      [this.DEMO_TYPES.MARKET_TICKER]:
        "Live market data simulation with color-coded price changes and volume",
      [this.DEMO_TYPES.TENSION_MONITOR]:
        "Real-time tension level visualization across quantum components",
      [this.DEMO_TYPES.NETWORK_VISUALIZER]:
        "Dynamic network topology with health indicators and metrics",
    });

    return descriptions[name] || "No description available";
  }

  getDemoFeatures(name) {
    const features = Object.freeze({
      [this.DEMO_TYPES.MARKET_TICKER]: [
        "Real-time data",
        "Color coding",
        "Volume tracking",
        "Price simulation",
      ],
      [this.DEMO_TYPES.TENSION_MONITOR]: [
        "Component monitoring",
        "Decay visualization",
        "Health indicators",
        "Performance metrics",
      ],
      [this.DEMO_TYPES.NETWORK_VISUALIZER]: [
        "Network topology",
        "Latency tracking",
        "Throughput monitoring",
        "Status indicators",
      ],
    });
    return features[name] || [];
  }

  getActiveDemos() {
    const active = [];
    for (const demoName of this.activeDemos) {
      const info = this.terminals.get(demoName);
      if (info) {
        active.push({
          name: demoName,
          startTime: info.startTime,
          duration: Date.now() - info.startTime,
        });
      }
    }
    return active;
  }

  async stopAllDemos() {
    const activeDemos = Array.from(this.activeDemos);
    Bun.stdout.write(`🛑 Stopping ${activeDemos.length} active demo(s)...\n`);

    const results = [];
    for (const demoName of activeDemos) {
      try {
        const result = await this.stopDemo(demoName);
        results.push(result);
      } catch (error) {
        results.push({ demo: demoName, error: error.message });
      }
    }

    return results;
  }

  generateReport() {
    Bun.stdout.write("🎮 QUANTUM TERMINAL DEMO SYSTEM\n");
    Bun.stdout.write("=".repeat(50) + "\n");

    const available = Object.keys(this.demoScripts);
    const active = this.activeDemos.size;

    Bun.stdout.write(`📊 Available Demos: ${available.length}\n`);
    Bun.stdout.write(`🟢 Active Demos: ${active}\n`);
    Bun.stdout.write("\n");

    available.forEach((name) => {
      const status = this.activeDemos.has(name) ? "🟢 RUNNING" : "⚪ AVAILABLE";
      const description = this.getDemoDescription(name);
      Bun.stdout.write(`${status} ${name.toUpperCase()}\n`);
      Bun.stdout.write(`   ${description}\n`);
    });

    if (active > 0) {
      Bun.stdout.write("\n");
      Bun.stdout.write("🔄 Currently Running:\n");
      this.getActiveDemos().forEach((demo) => {
        const duration = Math.floor(demo.duration / 1000);
        Bun.stdout.write(`   • ${demo.name} (${duration}s)\n`);
      });
    }

    return {
      available: available.length,
      active,
      demos: this.listDemos(),
    };
  }
}

export default QuantumTerminalDemo;
