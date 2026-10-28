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
