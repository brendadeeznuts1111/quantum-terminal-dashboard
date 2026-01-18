// [DOMAIN][TYPESCRIPT][STRIPPER][HSL:200,70%,85%][META:{OPTIMIZATION}][CLASS:EnhancedTypeScriptStripper]{BUN-API}

/**
 * Enhanced TypeScript Type Stripper with Formatting
 * Implements type stripping with proper code formatting for Bun environments
 */

class EnhancedTypeScriptStripper {
  constructor(options = {}) {
    this.options = {
      mode: "strip",
      preserveFormatting: true,
      preserveComments: true,
      ...options,
    };

    // Enhanced type annotation patterns
    this.patterns = {
      // Variable declarations: const name: type = value
      variableType: /(\s*)(\w+)(\s*:\s*[^=,;)}\]]+)(?=\s*[=,;)}\]])/g,

      // Function parameters: (param: type)
      parameterType: /(\w+)(\s*:\s*[^=,){}]+)(?=\s*[=,)}])/g,

      // Function return types: (): type =>
      returnType: /(\))(\s*:\s*[^{]+)(?=\s*[{])/g,

      // Interface definitions
      interfaceDef: /interface\s+\w+\s*{[^}]*}/g,

      // Type definitions
      typeDef: /type\s+\w+\s*=\s*[^;]+;/g,

      // Generic type parameters: <T>
      genericParams: /<[^>]+>/g,

      // Import type statements
      importType: /import\s+type\s+[^;]+;/g,

      // Export type statements
      exportType: /export\s+type\s+[^;]+;/g,

      // Type assertions: as Type
      typeAssertion: /\s+as\s+\w+/g,
    };
  }

  /**
   * Strip TypeScript types from code with enhanced formatting
   * @param {string} code - TypeScript code to process
   * @returns {string} JavaScript code with types stripped
   */
  stripTypes(code) {
    try {
      let result = code;
      let originalLength = result.length;

      // Remove interface definitions
      result = result.replace(this.patterns.interfaceDef, "");

      // Remove type definitions
      result = result.replace(this.patterns.typeDef, "");

      // Remove import/export type statements
      result = result.replace(this.patterns.importType, "");
      result = result.replace(this.patterns.exportType, "");

      // Remove variable type annotations
      result = result.replace(this.patterns.variableType, "$1$2");

      // Remove function parameter types
      result = result.replace(this.patterns.parameterType, "$1");

      // Remove function return types
      result = result.replace(this.patterns.returnType, "$1");

      // Remove generic type parameters (simplified)
      result = result.replace(this.patterns.genericParams, "");

      // Remove type assertions
      result = result.replace(this.patterns.typeAssertion, "");

      // Enhanced formatting
      if (this.options.preserveFormatting) {
        result = this.formatCode(result);
      }

      const sizeReduction = originalLength - result.length;
      const percentReduction = ((sizeReduction / originalLength) * 100).toFixed(
        1,
      );

      console.log(`✅ TypeScript types stripped successfully`);
      console.log(`   Original length: ${originalLength} chars`);
      console.log(`   Stripped length: ${result.length} chars`);
      console.log(
        `   Size reduction: ${percentReduction}% (${sizeReduction} chars)`,
      );

      return result;
    } catch (error) {
      console.error(`❌ Error stripping TypeScript types: ${error.message}`);
      throw error;
    }
  }

  /**
   * Format JavaScript code properly
   * @param {string} code - Unformatted JavaScript code
   * @returns {string} Formatted JavaScript code
   */
  formatCode(code) {
    // Basic formatting - add proper line breaks and indentation
    let formatted = code
      .replace(/;/g, ";\n")
      .replace(/{/g, " {\n  ")
      .replace(/}/g, "\n}\n")
      .replace(/\n\s*\n/g, "\n"); // Remove double newlines

    // Add proper indentation
    const lines = formatted.split("\n");
    let indentLevel = 0;
    const formattedLines = lines.map((line) => {
      const trimmed = line.trim();
      if (trimmed.includes("}")) indentLevel = Math.max(0, indentLevel - 1);
      const indented = "  ".repeat(indentLevel) + trimmed;
      if (trimmed.includes("{")) indentLevel++;
      return indented;
    });

    return formattedLines.join("\n");
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
      generics: (code.match(/<[^>]+>/g) || []).length,
      imports: (code.match(/import\s+.*from/g) || []).length,
      exports: (code.match(/export\s+/g) || []).length,
      enums: (code.match(/enum\s+\w+/g) || []).length,
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
      analysis.typeAnnotations +
      analysis.interfaces * 2 +
      analysis.types * 2 +
      analysis.enums * 3 +
      analysis.generics;

    analysis.complexityScore = complexityScore;
    analysis.complexityLevel =
      complexityScore < 10 ? "Low" : complexityScore < 25 ? "Medium" : "High";

    console.log(
      `   Complexity Score: ${complexityScore} (${analysis.complexityLevel})`,
    );

    return analysis;
  }

  /**
   * Strip types and save to output file with formatting
   * @param {string} inputPath - Input TypeScript file
   * @param {string} outputPath - Output JavaScript file
   */
  async stripAndSave(inputPath, outputPath) {
    try {
      const code = await Bun.file(inputPath).text();
      const strippedCode = this.stripTypes(code);

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
   * Create a comparison view of before and after
   * @param {string} originalCode - Original TypeScript code
   * @param {string} strippedCode - Stripped JavaScript code
   */
  showComparison(originalCode, strippedCode) {
    console.log(`\n📊 BEFORE AND AFTER COMPARISON:`);
    console.log(`=`.repeat(80));

    console.log(`\n🔹 ORIGINAL TYPESCRIPT:`);
    console.log(`-`.repeat(40));
    console.log(originalCode);

    console.log(`\n🔹 STRIPPED JAVASCRIPT:`);
    console.log(`-`.repeat(40));
    console.log(strippedCode);

    const savings = originalCode.length - strippedCode.length;
    console.log(`\n📈 SUMMARY:`);
    console.log(
      `   Size reduction: ${savings} characters (${((savings / originalCode.length) * 100).toFixed(1)}%)`,
    );
    console.log(
      `   Type annotations removed: ${(originalCode.match(/:\s*[^=,\)\}]+/g) || []).length}`,
    );
    console.log(
      `   Interfaces removed: ${(originalCode.match(/interface\s+\w+/g) || []).length}`,
    );
    console.log(
      `   Type definitions removed: ${(originalCode.match(/type\s+\w+/g) || []).length}`,
    );
  }
}

// CLI interface
async function main() {
  const args = Bun.argv.slice(2);
  const command = args[0] || "help";

  const stripper = new EnhancedTypeScriptStripper();

  switch (command) {
    case "strip":
      const filePath = args[1];
      if (!filePath) {
        console.error("❌ Please provide a file path");
        process.exit(1);
      }
      await stripper.stripAndSave(filePath, filePath.replace(".ts", ".js"));
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

    case "compare":
      const comparePath = args[1];
      if (!comparePath) {
        console.error("❌ Please provide a file path to compare");
        process.exit(1);
      }
      const originalCode = await Bun.file(comparePath).text();
      const strippedCode = stripper.stripTypes(originalCode);
      stripper.showComparison(originalCode, strippedCode);
      break;

    case "help":
      console.log(`🛠️ Enhanced TypeScript Stripper CLI`);
      console.log(`Usage:`);
      console.log(
        `  bun run enhanced-typescript-stripper.js strip <file.ts>     Strip types from single file`,
      );
      console.log(
        `  bun run enhanced-typescript-stripper.js analyze <file.ts>  Analyze TypeScript complexity`,
      );
      console.log(
        `  bun run enhanced-typescript-stripper.js compare <file.ts>  Show before/after comparison`,
      );
      console.log(
        `  bun run enhanced-typescript-stripper.js help               Show this help`,
      );
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      process.exit(1);
  }
}

// Export for module usage
export { EnhancedTypeScriptStripper };

// Run CLI if called directly
if (import.meta.main) {
  main().catch(console.error);
}
