// Node 24 runner for the opt-in live test; no package installation required.
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return nextResolve(candidate.href, context);
    }
    return nextResolve(specifier, context);
  },
});

if (process.env.PILOT_ALLOW_LIVE !== "yes") {
  console.error("Live request is disabled. Set PILOT_ALLOW_LIVE=yes to opt in.");
  process.exitCode = 1;
} else if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is missing. Add it to the protected runtime environment.");
  process.exitCode = 1;
} else {
  try {
    const { runPilot } = await import("./live-lead-demo.ts");
    const result = await runPilot(process.env.OPENAI_API_KEY);
    console.log(`Model: ${result.model}\nFictional sample: ${result.sample}\n\nModel response:\n${result.response}`);
    if (result.usage) {
      console.log(`\nTokens: ${result.usage.inputTokens} input, ${result.usage.outputTokens} output`);
    } else {
      console.log("\nToken usage was not provided by the API.");
    }
  } catch {
    // Do not print raw provider errors: they might contain sensitive information.
    console.error("The live request failed. Check API access, billing, model availability and network; no successful result was recorded.");
    process.exitCode = 1;
  }
}
