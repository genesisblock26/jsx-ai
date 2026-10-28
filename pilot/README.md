# Genesis Block: offline lead demo

This is a small, isolated demonstration of the existing `jsx-ai` provider
adapters. It uses one fictional lead and a **prewritten** assessment. Every
fetch is intercepted locally. It does not call an AI model, contact a customer,
connect to CRM/Drive, use real keys, or store a lead.

With Bun, from the repository root:

```sh
bun pilot/lead-demo.ts
```

In an environment with Node 24, the optional runner can be used instead:

```sh
node --experimental-transform-types pilot/run-node.mjs
```

The Node runner uses experimental TypeScript transformation and a small local
resolver because the upstream TypeScript files use extensionless imports. It
is intended for this demo, not as a production deployment recommendation.

Successful output shows the fictional sample and confirms that OpenAI,
Anthropic, and Gemini request/response shapes were exercised using mocks. It
does **not** establish that any provider or a particular model works live.

Before a real pilot, add and test an explicit provider/model policy, key and
spend controls, privacy rules, input/output validation, and approved storage.
Never put credentials or real customer data in this public repository.

## Optional live pilot (requires separate setup)

The opt-in pilot uses the same fictional lead, the `jsx-ai` OpenAI adapter,
and the explicitly selected `gpt-6-luna` model. The small pilot-specific adapter
sets this model's compatible request parameters without changing upstream code.
It attempts one request, with retries disabled, and prints the answer and token
counts when available. The key is read from the environment, never from a file.
Actual availability, cost, and model access depend on the OpenAI account.

The public repository and its Actions logs must contain only fictional data.
Never print or commit API keys. A prepared workflow template uses a manually
triggered job, with a GitHub Actions secret; it needs a reviewed, pinned pilot
commit and must be placed on the default branch before manual dispatch can work.
The template itself is not an active workflow. The active workflow, if installed,
defaults to an offline check; choosing live may incur an OpenAI API charge.

Offline verification without a key:

```sh
node --experimental-transform-types pilot/test-live-node.mjs
```
