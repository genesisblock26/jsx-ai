import assert from "node:assert/strict";
import { callText } from "../src/llm";

// This is a fixed, fictional example. The canned reply below is not an AI result.
const sample =
  "Fictional lead: a Malaysia-based fintech wants to explore cross-border payment services. No agreement has been signed.";
const canned = JSON.stringify({
  category: "Potential payments partnership",
  region: "Malaysia",
  need: "Explore cross-border payment services",
  status: "Human review required; no agreement confirmed",
  next_step: "Prepare questions about requirements and arrange a discovery call",
});

const originalFetch = globalThis.fetch;
const savedEnv = new Map<string, string | undefined>();
for (const name of [
  "JSX_AI_EXPLORER_URL",
  "OPENAI_API_URL",
  "OPENAI_BASE_URL",
]) {
  savedEnv.set(name, process.env[name]);
  delete process.env[name];
}

const requests: string[] = [];
globalThis.fetch = async (input, init) => {
  const url = new URL(String(input));
  const host = url.hostname;
  const allowed = [
    "api.openai.com",
    "api.anthropic.com",
    "generativelanguage.googleapis.com",
  ];
  // Every fetch is intercepted; unknown destinations fail locally.
  assert.ok(allowed.includes(host), `Unexpected mock destination: ${host}`);
  assert.equal(init?.method, "POST");
  assert.equal(typeof init?.body, "string");
  assert.ok(String(init?.body).includes(sample), "Missing fictional sample");
  requests.push(host);

  if (host === "api.openai.com") {
    return Response.json({
      choices: [{ message: { content: canned }, finish_reason: "stop" }],
    });
  }
  if (host === "api.anthropic.com") {
    return Response.json({ content: [{ type: "text", text: canned }] });
  }
  return Response.json({
    candidates: [{ content: { parts: [{ text: canned }] } }],
  });
};

try {
  const routes = [
    { provider: "openai", model: "gpt-demo" },
    { provider: "anthropic", model: "claude-demo" },
    { provider: "gemini", model: "gemini-demo" },
  ] as const;
  const messages = [
    {
      role: "system" as const,
      content: "Classify this fictional lead and return a brief JSON assessment.",
    },
    { role: "user" as const, content: sample },
  ];

  for (const route of routes) {
    const answer = await callText(messages, {
      runtime: "api",
      provider: route.provider,
      model: route.model,
      apiKey: "offline-test-only",
      retries: 0,
      timeoutMs: 2_000,
      maxTokens: 250,
    });
    assert.deepEqual(JSON.parse(answer), JSON.parse(canned));
  }

  assert.deepEqual(requests, [
    "api.openai.com",
    "api.anthropic.com",
    "generativelanguage.googleapis.com",
  ]);
  console.log("OFFLINE DEMO: fictional input and prewritten replies; no model was called.\n");
  console.log(`Sample: ${sample}\n`);
  console.log("Example assessment:");
  console.log(JSON.stringify(JSON.parse(canned), null, 2));
  console.log("\nPASS: simulated OpenAI, Anthropic and Gemini request/response routes.");
} finally {
  globalThis.fetch = originalFetch;
  for (const [name, value] of savedEnv) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}
