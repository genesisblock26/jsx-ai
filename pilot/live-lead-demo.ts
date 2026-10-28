import { callText, registerHook, registerProvider } from "../src/llm";
import { OpenAIProvider } from "../src/providers/openai";
import type { PreparedPrompt } from "../src/types";

// Deliberately fixed and fictional. Never put customer data in this public demo.
export const sample =
  "Fictional lead: a Malaysia-based fintech wants to explore cross-border payment services. No agreement has been signed.";
const model = "gpt-6-luna";

// Keep the upstream adapter untouched. Its generic request needs these settings
// for GPT-6 Luna. The endpoint is checked before any key is sent.
class PilotOpenAIProvider extends OpenAIProvider {
  override buildRequest(prepared: PreparedPrompt, selectedModel: string, key: string) {
    if (selectedModel !== model) throw new Error("Unexpected model");
    const request = super.buildRequest(prepared, selectedModel, key);
    if (request.url !== "https://api.openai.com/v1/chat/completions") {
      throw new Error("Unexpected API destination");
    }
    const { max_tokens: _legacyLimit, ...body } = request.body;
    return {
      ...request,
      body: {
        ...body,
        max_completion_tokens: 400,
        reasoning_effort: "none",
        store: false,
      },
    };
  }
}

/** One fictional request. Caller must provide the secret from its environment. */
export async function runPilot(apiKey: string) {
  if (!apiKey.trim()) throw new Error("API key is missing");
  const envNames = ["OPENAI_API_URL", "OPENAI_BASE_URL", "JSX_AI_EXPLORER_URL"];
  const savedEnv = new Map(envNames.map((name) => [name, process.env[name]]));
  for (const name of envNames) delete process.env[name];

  let usage: { inputTokens: number; outputTokens: number } | undefined;
  const unregisterProvider = registerProvider(new PilotOpenAIProvider());
  const unregisterHook = registerHook((event) => {
    if (event.method === "callText" && event.provider === "openai" && event.model === model) {
      usage = event.usage;
    }
  });

  try {
    const response = await callText(
      [
        {
          role: "system",
          content: "This is a fictional example. Briefly classify the lead, describe its need, and propose one question for a human reviewer. Do not invent an agreement.",
        },
        { role: "user", content: sample },
      ],
      {
        provider: "openai",
        runtime: "api",
        model,
        apiKey,
        maxTokens: 400,
        timeoutMs: 30_000,
        retries: 0,
      },
    );
    if (!response.trim()) throw new Error("The model returned no text");
    return { model, sample, response, usage };
  } finally {
    unregisterHook();
    unregisterProvider();
    for (const [name, value] of savedEnv) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}
