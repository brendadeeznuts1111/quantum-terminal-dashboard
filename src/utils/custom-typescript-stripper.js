// [DOMAIN][TYPESCRIPT][STRIPPER][HSL:200,70%,85%][META:{OPTIMIZATION}][CLASS:CustomTypeScriptStripper]{BUN-API}

/**
 * Custom TypeScript Type Stripper
 * Implements type stripping functionality for Bun environments
 */

class CustomTypeScriptStripper {
  constructor(options = {}) {
    this.options = {
      mode: "strip", // 'strip' or 'transform'
      preserveComments: true,
      ...options,
    };

    // Type annotation patterns
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
   * Strip TypeScript types from code
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

      // Clean up extra whitespace
      result = result.replace(/\s+/g, " ").trim();

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
   * Strip types from a file
   * @param {string} filePath - Path to TypeScript file
   * @returns {string} JavaScript code with types stripped
   */
  async stripFile(filePath) {
    try {
      const code = await Bun.file(filePath).text();

      console.log(`📁 Processing file: ${filePath}`);
      const result = this.stripTypes(code);

      return result;
    } catch (error) {
      console.error(`❌ Error processing file ${filePath}: ${error.message}`);
      throw error;
    }
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
   * Strip types and save to output file
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
   * Transform TypeScript interfaces to JavaScript objects (basic implementation)
   * @param {string} code - TypeScript code
   * @returns {string} Transformed JavaScript code
   */
  transformInterfaces(code) {
    console.log(`🔄 Transforming TypeScript interfaces...`);

    // Basic interface to object conversion
    const interfaceToObject = (match) => {
      const interfaceName = match.match(/interface\s+(\w+)/)[1];
      const properties = match.match(/{([^}]*)}/)[1];

      // Convert interface properties to JSDoc comments
      const jsDoc = properties
        .split(";")
        .filter((prop) => prop.trim())
        .map((prop) => {
          const [name, type] = prop.trim().split(":");
          return `   * @property {${type?.trim()}} ${name?.trim()}`;
        })
        .join("\n");

      return `/**
 * ${interfaceName} interface
${jsDoc}
 */`;
    };

    return code.replace(this.patterns.interfaceDef, interfaceToObject);
  }
}

// Quantum system specific stripper
class QuantumSystemStripper extends CustomTypeScriptStripper {
  constructor() {
    super({ mode: "strip", preserveComments: true });
  }

  /**
   * Process Quantum system components
   */
  async processQuantumComponents() {
    const components = ["./demo-typescript.ts"];

    console.log(`🚀 Processing Quantum system components...`);

    for (const component of components) {
      try {
        await this.stripAndSave(component, component.replace(".ts", ".js"));
        console.log(`   ✅ ${component} processed`);
      } catch (error) {
        console.error(`   ❌ ${component} failed: ${error.message}`);
      }
    }
  }
}

// CLI interface
async function main() {
  const args = Bun.argv.slice(2);
  const command = args[0] || "help";

  const stripper = new CustomTypeScriptStripper();

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

    case "quantum":
      const quantumStripper = new QuantumSystemStripper();
      await quantumStripper.processQuantumComponents();
      break;

    case "help":
      console.log(`🛠️ Custom TypeScript Stripper CLI`);
      console.log(`Usage:`);
      console.log(
        `  bun run custom-typescript-stripper.js strip <file.ts>     Strip types from single file`,
      );
      console.log(
        `  bun run custom-typescript-stripper.js analyze <file.ts>  Analyze TypeScript complexity`,
      );
      console.log(
        `  bun run custom-typescript-stripper.js quantum            Process Quantum components`,
      );
      console.log(
        `  bun run custom-typescript-stripper.js help               Show this help`,
      );
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      process.exit(1);
  }
}

// Export for module usage
export { CustomTypeScriptStripper, QuantumSystemStripper };

// Run CLI if called directly
if (import.meta.main) {
  main().catch(console.error);
}
