import Anthropic from '@anthropic-ai/sdk';
import { OllamaError } from './ollama.js';

// Claude models offered in the studio. `effort` is only sent to models that support it.
export const MODELS = [
  {
    id: 'claude-fable-5-1',
    label: 'Claude Fable 5.1',
    tier: 'Best quality',
    blurb: 'Most capable model. Deepest reasoning and the most careful drafting, but slower and the most expensive.',
    effort: true,
    fallbacks: true,
    maxTokens: 64000,
  },
  {
    id: 'claude-opus-5-5',
    label: 'Claude Opus 5.5',
    tier: 'High quality',
    blurb: 'Very strong drafting at a lower cost. A good choice when Fable is too slow.',
    effort: true,
    fallbacks: true,
    maxTokens: 64000,
  },
  {
    id: 'claude-sonnet-5-5',
    label: 'Claude Sonnet 5.5',
    tier: 'Balanced',
    blurb: 'Fast and strong. A great everyday choice for most agreements.',
    effort: true,
    fallbacks: true,
    maxTokens: 64000,
  },
  {
    id: 'claude-haiku-4-5',
    label: 'Claude Haiku 4.5',
    tier: 'Fastest',
    blurb: 'Quick, low-cost drafts. Good for simple documents and first passes.',
    effort: false,
    fallbacks: false,
    maxTokens: 32000,
  },
];

export const DEFAULT_MODEL = 'claude-fable-5-1';
export const modelById = (id) => MODELS.find((m) => m.id === id);

const EFFORT = { generate: 'medium', refine: 'medium', review: 'high' };
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

const envKey = () => process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || '';
export const serverHasKey = () => Boolean(envKey());

let envClient;
export function getClient(userKey) {
  if (userKey) return new Anthropic({ apiKey: userKey, maxRetries: 1 });
  if (!serverHasKey()) return null;
  envClient ??= new Anthropic({ maxRetries: 2 });
  return envClient;
}

export const looksLikeKey = (k) => typeof k === 'string' && /^[\w\-.]{20,400}$/.test(k);

export async function streamClaude({ client, model, system, user, task, signal, onText }) {
  const params = {
    model: model.id,
    max_tokens: model.maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  };
  if (model.effort) params.output_config = { effort: EFFORT[task] ?? 'medium' };

  // Server-side fallback re-runs the request on another model if a safety classifier declines it.
  const useFallbacks = model.fallbacks && process.env.ANTHROPIC_FALLBACKS !== 'off';
  const stream = useFallbacks
    ? client.beta.messages.stream({ ...params, betas: [FALLBACK_BETA], fallbacks: 'default' }, { signal })
    : client.messages.stream(params, { signal });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') onText(event.delta.text);
  }
  const final = await stream.finalMessage();
  return {
    stopReason: final.stop_reason,
    stopDetails: final.stop_details ?? null,
    servedBy: final.model,
    usage: { input: final.usage?.input_tokens ?? 0, output: final.usage?.output_tokens ?? 0 },
  };
}

export async function testKey(client) {
  await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 16,
    messages: [{ role: 'user', content: 'Reply with the single word OK.' }],
  });
}

// Maps SDK errors to messages a non-technical user can act on. Returns null for user aborts.
export function friendlyError(err) {
  if (err instanceof Anthropic.APIUserAbortError || err?.name === 'AbortError') return null;
  if (err instanceof OllamaError) return { status: err.status, code: err.code, message: err.message };
  if (err instanceof Anthropic.AuthenticationError)
    return { status: 401, code: 'auth', message: 'Claude rejected the API key. Check it in Settings and try again.' };
  if (err instanceof Anthropic.PermissionDeniedError)
    return { status: 403, code: 'permission', message: 'Your Claude account does not have access to this model. Pick a different model.' };
  if (err instanceof Anthropic.NotFoundError)
    return { status: 404, code: 'model', message: 'This model is not available on your Claude account. Pick a different model.' };
  if (err instanceof Anthropic.RateLimitError)
    return { status: 429, code: 'rate_limit', message: 'Claude is rate limiting this account. Wait a moment and try again.' };
  if (err instanceof Anthropic.BadRequestError)
    return { status: 400, code: 'bad_request', message: `Claude could not process this request. ${String(err.message).slice(0, 300)}` };
  if (err instanceof Anthropic.APIConnectionError)
    return { status: 502, code: 'network', message: 'Could not reach Claude. Check your internet connection and try again.' };
  if (err instanceof Anthropic.APIError)
    return { status: 502, code: 'upstream', message: 'Claude is temporarily unavailable. Please try again shortly.' };
  return { status: 500, code: 'internal', message: 'Something went wrong while generating. Please try again.' };
}
