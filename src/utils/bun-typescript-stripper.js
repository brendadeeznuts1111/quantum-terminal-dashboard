// [DOMAIN][TYPESCRIPT][STRIPPER][HSL:200,70%,85%][META:{BUN-COMPATIBLE}][CLASS:BunTypeScriptStripper]{BUN-API}

/**
 * Bun-compatible TypeScript Type Stripper
 * Replicates Node.js stripTypeScriptTypes API for Bun environments
 */

/**
 * Strip TypeScript types from code - Bun implementation
 * @param {string} code - TypeScript code to process
 * @param {object} options - Options object
 * @param {string} options.mode - 'strip' or 'transform'
 * @param {string} options.sourceUrl - Source URL for source maps
 * @param {boolean} options.sourceMap - Generate source maps
 * @returns {string} JavaScript code with types stripped
 */
export function stripTypeScriptTypes(code, options = {}) {
  const { mode = "strip", sourceUrl, sourceMap = false } = options;

  let result = code;
  let originalLength = result.length;

  try {
    // Mode-specific processing
    if (mode === "strip") {
      result = stripMode(result);
    } else if (mode === "transform") {
      result = transformMode(result);
    } else {
      throw new Error(`Unsupported mode: ${mode}`);
    }

    // Add source URL if provided
    if (sourceUrl) {
      result += "\n\n//# sourceURL=" + sourceUrl + ";";
    }

    // Add source map if requested (basic implementation)
    if (sourceMap && mode === "transform") {
      result +=
        "\n//# sourceMappingURL=data:application/json;base64," +
        btoa(
          JSON.stringify({
            version: 3,
            file: sourceUrl || "generated.js",
            sourceRoot: "",
            sources: [sourceUrl || "source.ts"],
            sourcesContent: [code],
            mappings: "",
          }),
        );
    }

    // Log performance metrics
    const sizeReduction = originalLength - result.length;
    const percentReduction = ((sizeReduction / originalLength) * 100).toFixed(
      1,
    );

    console.log(`✅ TypeScript types stripped (${mode} mode)`);
    console.log(`   Original length: ${originalLength} chars`);
    console.log(`   Stripped length: ${result.length} chars`);
    console.log(`   Size reduction: ${percentReduction}%`);

    return result;
  } catch (error) {
    console.error(`❌ Error in stripTypeScriptTypes: ${error.message}`);
    throw error;
  }
}

/**
 * Strip mode - remove type annotations only
 */
function stripMode(code) {
  let result = code;

  // Remove interface definitions
  result = result.replace(/interface\s+\w+\s*{[^}]*}/g, "");

  // Remove type definitions
  result = result.replace(/type\s+\w+\s*=\s*[^;]+;/g, "");

  // Remove import/export type statements
  result = result.replace(/import\s+type\s+[^;]+;/g, "");
  result = result.replace(/export\s+type\s+[^;]+;/g, "");

  // Remove variable type annotations
  result = result.replace(
    /(\s*)(\w+)(\s*:\s*[^=,;)}\]]+)(?=\s*[=,;)}\]])/g,
    "$1$2",
  );

  // Remove function parameter types
  result = result.replace(/(\w+)(\s*:\s*[^=,){}]+)(?=\s*[=,)}])/g, "$1");

  // Remove function return types
  result = result.replace(/(\))(\s*:\s*[^{]+)(?=\s*[{])/g, "$1");

  // Remove generic type parameters
  result = result.replace(/<[^>]+>/g, "");

  // Remove type assertions
  result = result.replace(/\s+as\s+\w+/g, "");

  // Clean up extra whitespace
  result = result.replace(/\s+/g, " ").trim();

  return result;
}

/**
 * Transform mode - convert TypeScript to JavaScript
 */
function transformMode(code) {
  let result = code;

  // Transform interfaces to JSDoc comments
  result = result.replace(
    /interface\s+(\w+)\s*{([^}]*)}/g,
    (match, name, body) => {
      const properties = body
        .split(";")
        .filter((prop) => prop.trim())
        .map((prop) => {
          const [propName, propType] = prop.trim().split(":");
          return ` * @property {${propType?.trim()}} ${propName?.trim()}`;
        })
        .join("\n ");

      return `/**
 * ${name} interface
${properties}
 */`;
    },
  );

  // Transform enums to objects
  result = result.replace(/enum\s+(\w+)\s*{([^}]*)}/g, (match, name, body) => {
    const members = body
      .split(",")
      .map((member) => member.trim())
      .filter((member) => member)
      .map((member) => {
        const [key, value] = member.split("=").map((s) => s.trim());
        if (value) {
          return `  ${key}: ${value},`;
        }
        return `  ${key}: '${key}',`;
      })
      .join("\n");

    return `const ${name} = {\n${members}\n};`;
  });

  // Apply strip mode transformations
  result = stripMode(result);

  return result;
}

/**
 * Bun-compatible module wrapper
 */
class BunTypeScriptStripper {
  constructor(options = {}) {
    this.defaultOptions = {
      mode: "strip",
      sourceMap: false,
      ...options,
    };
  }

  /**
   * Strip types using the main function
   */
  strip(code, options = {}) {
    return stripTypeScriptTypes(code, { ...this.defaultOptions, ...options });
  }

  /**
   * Strip types from file
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
      return this.strip(code, config);
    } catch (error) {
      console.error(`❌ Error processing file ${filePath}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Strip and save file
   */
  async stripAndSave(inputPath, outputPath, options = {}) {
    try {
      const strippedCode = await this.stripFile(inputPath, options);
      await Bun.write(outputPath, strippedCode);

      console.log(`💾 Saved stripped code to: ${outputPath}`);
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
   * Analyze code complexity
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

    const complexityScore =
      analysis.typeAnnotations +
      analysis.interfaces * 2 +
      analysis.types * 2 +
      analysis.enums * 3 +
      analysis.generics;

    analysis.complexityScore = complexityScore;
    analysis.complexityLevel =
      complexityScore < 10 ? "Low" : complexityScore < 25 ? "Medium" : "High";

    return analysis;
  }
}

// CLI interface
async function main() {
  const args = Bun.argv.slice(2);
  const command = args[0] || "help";

  const stripper = new BunTypeScriptStripper();

  switch (command) {
    case "strip":
      const filePath = args[1];
      if (!filePath) {
        console.error("❌ Please provide a file path");
        process.exit(1);
      }
      await stripper.stripAndSave(filePath, filePath.replace(".ts", ".js"));
      break;

    case "transform":
      const transformPath = args[1];
      if (!transformPath) {
        console.error("❌ Please provide a file path");
        process.exit(1);
      }
      await stripper.stripAndSave(
        transformPath,
        transformPath.replace(".ts", ".js"),
        { mode: "transform" },
      );
      break;

    case "analyze":
      const analyzePath = args[1];
      if (!analyzePath) {
        console.error("❌ Please provide a file path to analyze");
        process.exit(1);
      }
      const code = await Bun.file(analyzePath).text();
      const analysis = stripper.analyzeComplexity(code);
      console.log(`📊 Complexity Analysis:`);
      console.log(
        `   Score: ${analysis.complexityScore} (${analysis.complexityLevel})`,
      );
      break;

    case "demo":
      // Demo the exact example from the user
      const demoCode = "const a: number = 1;";
      const strippedDemo = stripTypeScriptTypes(demoCode, {
        mode: "strip",
        sourceUrl: "source.ts",
      });
      console.log("🎯 Demo Result:");
      console.log(strippedDemo);
      break;

    case "help":
      console.log(`🛠️ Bun TypeScript Stripper CLI`);
      console.log(`Usage:`);
      console.log(
        `  bun run bun-typescript-stripper.js strip <file.ts>     Strip types from file`,
      );
      console.log(
        `  bun run bun-typescript-stripper.js transform <file.ts>  Transform TypeScript to JavaScript`,
      );
      console.log(
        `  bun run bun-typescript-stripper.js analyze <file.ts>   Analyze code complexity`,
      );
      console.log(
        `  bun run bun-typescript-stripper.js demo                Run demo example`,
      );
      console.log(
        `  bun run bun-typescript-stripper.js help               Show this help`,
      );
      console.log(`\nAPI:`);
      console.log(
        `  import { stripTypeScriptTypes } from './bun-typescript-stripper.js';`,
      );
      console.log(
        `  const stripped = stripTypeScriptTypes(code, { mode: 'strip', sourceUrl: 'source.ts' });`,
      );
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      process.exit(1);
  }
}

// Export for module usage
export { BunTypeScriptStripper };

// Run CLI if called directly
if (import.meta.main) {
  main().catch(console.error);
}
