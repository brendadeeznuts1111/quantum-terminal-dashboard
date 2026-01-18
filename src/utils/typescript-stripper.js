// [DOMAIN][TYPESCRIPT][STRIPPER][HSL:200,70%,85%][META:{OPTIMIZATION}][CLASS:TypeScriptStripper][#REF:bun-strip-types]{BUN-API}

import { stripTypeScriptTypes } from "node:module";

/**
 * Quantum TypeScript Type Stripper
 * Leverages Bun's native stripTypeScriptTypes for optimal performance
 */

class QuantumTypeScriptStripper {
  constructor(options = {}) {
    this.defaultOptions = {
      mode: "strip", // 'strip' or 'transform'
      sourceMap: false,
      sourceUrl: null,
      ...options,
    };
  }

  /**
   * Strip TypeScript types from code
   * @param {string} code - TypeScript code to process
   * @param {object} options - Stripping options
   * @returns {string} JavaScript code with types stripped
   */
  stripTypes(code, options = {}) {
    try {
      const config = { ...this.defaultOptions, ...options };
      const result = stripTypeScriptTypes(code, config);

      console.log(`✅ TypeScript types stripped successfully`);
      console.log(`   Mode: ${config.mode}`);
      console.log(`   Original length: ${code.length} chars`);
      console.log(`   Stripped length: ${result.length} chars`);
      console.log(
        `   Size reduction: ${(((code.length - result.length) / code.length) * 100).toFixed(1)}%`,
      );

      return result;
    } catch (error) {
      console.error(`❌ Error stripping TypeScript types: ${error.message}`);
      throw error;
    }
  }

  /**
   * Strip types from a file
   * @param {string} filePath - Path to TypeScript file
   * @param {object} options - Stripping options
   * @returns {string} JavaScript code with types stripped
   */
  async stripFile(filePath, options = {}) {
    try {
      const code = await Bun.file(filePath).text();
      const config = {
        ...this.defaultOptions,
        sourceUrl: filePath,
        ...options,
      };

      console.log(`📁 Processing file: ${filePath}`);
      return this.stripTypes(code, config);
    } catch (error) {
      console.error(`❌ Error processing file ${filePath}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Strip types from multiple files
   * @param {string[]} filePaths - Array of file paths
   * @param {object} options - Stripping options
   * @returns {object} Map of file paths to stripped code
   */
  async stripFiles(filePaths, options = {}) {
    const results = {};

    console.log(`📚 Processing ${filePaths.length} files...`);

    for (const filePath of filePaths) {
      try {
        results[filePath] = await this.stripFile(filePath, options);
        console.log(`   ✅ ${filePath} processed`);
      } catch (error) {
        console.error(`   ❌ ${filePath} failed: ${error.message}`);
        results[filePath] = null;
      }
    }

    const successCount = Object.values(results).filter(
      (r) => r !== null,
    ).length;
    console.log(
      `📊 Processing complete: ${successCount}/${filePaths.length} files successful`,
    );

    return results;
  }

  /**
   * Strip types and save to output file
   * @param {string} inputPath - Input TypeScript file
   * @param {string} outputPath - Output JavaScript file
   * @param {object} options - Stripping options
   */
  async stripAndSave(inputPath, outputPath, options = {}) {
    try {
      const strippedCode = await this.stripFile(inputPath, options);
      await Bun.write(outputPath, strippedCode);

      console.log(`💾 Saved stripped code to: ${outputPath}`);
      console.log(`   Input: ${inputPath}`);
      console.log(`   Output: ${outputPath}`);

      return {
        success: true,
        inputPath,
        outputPath,
        size: strippedCode.length,
      };
    } catch (error) {
      console.error(`❌ Error saving stripped code: ${error.message}`);
      throw error;
    }
  }

  /**
   * Transform TypeScript to JavaScript (includes enums, namespaces)
   * @param {string} code - TypeScript code
   * @param {object} options - Transformation options
   * @returns {string} Transformed JavaScript code
   */
  transformCode(code, options = {}) {
    const config = {
      ...this.defaultOptions,
      mode: "transform",
      sourceMap: true,
      ...options,
    };

    console.log(`🔄 Transforming TypeScript to JavaScript...`);
    return this.stripTypes(code, config);
  }

  /**
   * Analyze TypeScript code complexity
   * @param {string} code - TypeScript code
   * @returns {object} Complexity analysis
   */
  analyzeComplexity(code) {
    const analysis = {
      totalLines: code.split("\n").length,
      typeAnnotations: (code.match(/:\s*[^=,\)\}]+/g) || []).length,
      interfaces: (code.match(/interface\s+\w+/g) || []).length,
      types: (code.match(/type\s+\w+/g) || []).length,
      enums: (code.match(/enum\s+\w+/g) || []).length,
      generics: (code.match(/<[^>]+>/g) || []).length,
      imports: (code.match(/import\s+.*from/g) || []).length,
      exports: (code.match(/export\s+/g) || []).length,
    };

    console.log(`📊 TypeScript Complexity Analysis:`);
    console.log(`   Total Lines: ${analysis.totalLines}`);
    console.log(`   Type Annotations: ${analysis.typeAnnotations}`);
    console.log(`   Interfaces: ${analysis.interfaces}`);
    console.log(`   Types: ${analysis.types}`);
    console.log(`   Enums: ${analysis.enums}`);
    console.log(`   Generics: ${analysis.generics}`);
    console.log(`   Imports: ${analysis.imports}`);
    console.log(`   Exports: ${analysis.exports}`);

    const complexityScore =
      analysis.typeAnnotations * 1 +
      analysis.interfaces * 2 +
      analysis.types * 2 +
      analysis.enums * 3 +
      analysis.generics * 1;

    analysis.complexityScore = complexityScore;
    analysis.complexityLevel =
      complexityScore < 10 ? "Low" : complexityScore < 25 ? "Medium" : "High";

    console.log(
      `   Complexity Score: ${complexityScore} (${analysis.complexityLevel})`,
    );

    return analysis;
  }

  /**
   * Create a bundle with stripped types
   * @param {string[]} entryPoints - Entry point files
   * @param {object} buildOptions - Build options
   */
  async createOptimizedBundle(entryPoints, buildOptions = {}) {
    console.log(`📦 Creating optimized bundle...`);

    const strippedFiles = await this.stripFiles(entryPoints);
    const bundleComponents = [];

    for (const [filePath, code] of Object.entries(strippedFiles)) {
      if (code) {
        const analysis = this.analyzeComplexity(code);
        bundleComponents.push({
          filePath,
          code,
          size: code.length,
          complexity: analysis.complexityScore,
        });
      }
    }

    const totalSize = bundleComponents.reduce(
      (sum, comp) => sum + comp.size,
      0,
    );
    const avgComplexity =
      bundleComponents.reduce((sum, comp) => sum + comp.complexity, 0) /
      bundleComponents.length;

    console.log(`📊 Bundle Statistics:`);
    console.log(`   Files: ${bundleComponents.length}`);
    console.log(`   Total Size: ${totalSize} bytes`);
    console.log(`   Average Complexity: ${avgComplexity.toFixed(1)}`);

    return {
      components: bundleComponents,
      totalSize,
      averageComplexity: avgComplexity,
      timestamp: new Date().toISOString(),
    };
  }
}

// Quantum system specific TypeScript stripper
class QuantumSystemStripper extends QuantumTypeScriptStripper {
  constructor() {
    super({
      mode: "strip",
      sourceMap: false,
      sourceUrl: "quantum-system",
    });
  }

  /**
   * Strip types from Quantum system components
   */
  async stripQuantumComponents() {
    const quantumFiles = [
      "./src/quantum-app.ts",
      "./src/components/Dashboard/QuantumDashboard.tsx",
      "./src/components/Terminal/PTYManager.ts",
      "./src/utils/string-width.ts",
      "./src/validation/quantum-cli.js",
    ];

    console.log(`🚀 Processing Quantum system components...`);
    return await this.stripFiles(quantumFiles);
  }

  /**
   * Create production-ready Quantum bundle
   */
  async createQuantumBundle() {
    console.log(`⚡ Creating Quantum production bundle...`);

    const bundle = await this.createOptimizedBundle([
      "./src/quantum-app.ts",
      "./src/components/Dashboard/QuantumDashboard.tsx",
    ]);

    // Generate bundle manifest
    const manifest = {
      name: "quantum-cash-flow-lattice",
      version: "1.5.0",
      buildTime: new Date().toISOString(),
      components: bundle.components.length,
      totalSize: bundle.totalSize,
      optimization: "typescript-types-stripped",
      performance: {
        averageComplexity: bundle.averageComplexity,
        typeAnnotationsRemoved: "All",
        bundleSizeOptimized: true,
      },
    };

    await Bun.write(
      "./quantum-bundle-manifest.json",
      JSON.stringify(manifest, null, 2),
    );
    console.log(`📋 Bundle manifest saved: quantum-bundle-manifest.json`);

    return manifest;
  }
}

// CLI interface for the stripper
async function main() {
  const args = Bun.argv.slice(2);
  const command = args[0] || "help";

  const stripper = new QuantumSystemStripper();

  switch (command) {
    case "strip":
      const filePath = args[1];
      if (!filePath) {
        console.error("❌ Please provide a file path");
        process.exit(1);
      }
      await stripper.stripAndSave(filePath, filePath.replace(".ts", ".js"));
      break;

    case "quantum":
      await stripper.stripQuantumComponents();
      break;

    case "bundle":
      await stripper.createQuantumBundle();
      break;

    case "analyze":
      const analyzePath = args[1];
      if (!analyzePath) {
        console.error("❌ Please provide a file path to analyze");
        process.exit(1);
      }
      const code = await Bun.file(analyzePath).text();
      stripper.analyzeComplexity(code);
      break;

    case "help":
      console.log(`🛠️ Quantum TypeScript Stripper CLI`);
      console.log(`Usage:`);
      console.log(
        `  bun run typescript-stripper.js strip <file.ts>     Strip types from single file`,
      );
      console.log(
        `  bun run typescript-stripper.js quantum            Strip Quantum system components`,
      );
      console.log(
        `  bun run typescript-stripper.js bundle            Create optimized bundle`,
      );
      console.log(
        `  bun run typescript-stripper.js analyze <file.ts>  Analyze TypeScript complexity`,
      );
      console.log(
        `  bun run typescript-stripper.js help               Show this help`,
      );
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      process.exit(1);
  }
}

// Export for module usage
export { QuantumTypeScriptStripper, QuantumSystemStripper };

// Run CLI if called directly
if (import.meta.main) {
  main().catch(console.error);
}
