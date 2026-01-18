// Debug staging configuration import

console.log("🔍 Debugging staging configuration import...\n");

try {
  console.log("1. Testing direct YAML import...");
  const configs = await import("./src/config/staging-config-fixed.yaml");
  console.log("✅ YAML imported successfully");
  console.log("Keys:", Object.keys(configs));

  if (configs.staging) {
    console.log("✅ Staging config found");
    console.log("Staging keys:", Object.keys(configs.staging));
  } else {
    console.log("❌ Staging config not found");
  }
} catch (error) {
  console.error("❌ Import failed:", error.message);
  console.error("Stack:", error.stack);
}

try {
  console.log("\n2. Testing StagingConfigManager import...");
  const { StagingConfigManager } =
    await import("./src/config/staging-config-manager.ts");
  console.log("✅ StagingConfigManager imported successfully");

  const config = new StagingConfigManager();
  console.log("✅ StagingConfigManager instantiated successfully");
} catch (error) {
  console.error("❌ StagingConfigManager failed:", error.message);
  console.error("Stack:", error.stack);
}
