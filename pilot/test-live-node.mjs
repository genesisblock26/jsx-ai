import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return nextResolve(candidate.href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { runPilot, sample } = await import("./live-lead-demo.ts");
const originalFetch = globalThis.fetch;
const names = ["OPENAI_API_URL", "OPENAI_BASE_URL", "JSX_AI_EXPLORER_URL"];
const prior = new Map(names.map((name) => [name, process.env[name]]));
let count = 0;

try {
  for (const name of names) process.env[name] = "https://untrusted.example";
  globalThis.fetch = async (url, init) => {
    count++;
    assert.equal(String(url), "https://api.openai.com/v1/chat/completions");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model, "gpt-6-luna");
    assert.equal(body.reasoning_effort, "none");
    assert.equal(body.max_completion_tokens, 400);
    assert.equal(body.max_tokens, undefined);
    assert.equal(body.store, false);
    assert.ok(JSON.stringify(body.messages).includes(sample));
    assert.equal(new Headers(init?.headers).get("authorization"), "Bearer offline-test-key");
    return Response.json({
      choices: [{ message: { content: "Fictional result" }, finish_reason: "stop" }],
      usage: { prompt_tokens: 42, completion_tokens: 9 },
    });
  };
  const result = await runPilot("offline-test-key");
  assert.equal(count, 1);
  assert.equal(result.response, "Fictional result");
  assert.deepEqual(result.usage, { inputTokens: 42, outputTokens: 9 });
  for (const name of names) assert.equal(process.env[name], "https://untrusted.example");

  // A 429 must not cause retries, since one opt-in should mean one request.
  count = 0;
  globalThis.fetch = async () => {
    count++;
    return new Response("simulated error", { status: 429 });
  };
  await assert.rejects(runPilot("offline-test-key"));
  assert.equal(count, 1);
  console.log("PASS: mock success, usage, protected endpoint and no retries on failure. No API was called.");
} finally {
  globalThis.fetch = originalFetch;
  for (const [name, value] of prior) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}
