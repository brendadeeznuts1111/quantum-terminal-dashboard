// Test native stripTypeScriptTypes from Node.js module

try {
  const { stripTypeScriptTypes } = await import("node:module");

  const code = "const a: number = 1;";
  const strippedCode = stripTypeScriptTypes(code, {
    mode: "strip",
    sourceUrl: "source.ts",
  });
  console.log(strippedCode);
  // Expected: const a = 1\n\n//# sourceURL=source.ts;
} catch (error) {
  console.error("❌ stripTypeScriptTypes not available:", error.message);
  console.log("🔄 Falling back to custom implementation...");

  // Fallback implementation
  function customStripTypeScriptTypes(code, options = {}) {
    let result = code;

    // Remove variable type annotations
    result = result.replace(
      /(\s*)(\w+)(\s*:\s*[^=,;)}\]]+)(?=\s*[=,;)}\]])/g,
      "$1$2",
    );

    // Remove function parameter types
    result = result.replace(/(\w+)(\s*:\s*[^=,){}]+)(?=\s*[=,)}])/g, "$1");

    // Remove function return types
    result = result.replace(/(\))(\s*:\s*[^{]+)(?=\s*[{])/g, "$1");

    // Add source URL if provided
    if (options.sourceUrl) {
      result += "\n\n//# sourceURL=" + options.sourceUrl + ";";
    }

    return result;
  }

  const code = "const a: number = 1;";
  const strippedCode = customStripTypeScriptTypes(code, {
    mode: "strip",
    sourceUrl: "source.ts",
  });
  console.log(strippedCode);
}
