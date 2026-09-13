import { defineAgent } from "eve";
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const openrouter = createOpenAICompatible({ name: 'openrouter', baseURL: 'https://openrouter.ai/api/v1', apiKey: process.env.OPENROUTER_API_KEY });

export default defineAgent({
  model: openrouter.chatModel(process.env.OPENROUTER_MODEL || 'openai/gpt-4.1-mini'),
  defaultTools: false,
  modelContextWindowTokens: 32000,
  limits: { maxInputTokensPerSession: 20000, maxOutputTokensPerSession: 3000, sessionTimeoutMs: 3600000 },
});
