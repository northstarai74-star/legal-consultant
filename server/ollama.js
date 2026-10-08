// Local models served by Ollama (https://ollama.com). Everything here talks to the Ollama
// server on this computer only, so no document text leaves the machine.

function normaliseHost(raw) {
  let host = String(raw || 'http://127.0.0.1:11434').trim();
  if (!/^https?:\/\//i.test(host)) host = `http://${host}`;
  // Ollama's OLLAMA_HOST may be a bind address such as 0.0.0.0; that is not something to connect to.
  host = host.replace('//0.0.0.0', '//127.0.0.1');
  if (!/:\d+$/.test(host.replace(/\/+$/, ''))) host = `${host.replace(/\/+$/, '')}:11434`;
  return host.replace(/\/+$/, '');
}

export const OLLAMA_HOST = normaliseHost(process.env.OLLAMA_HOST);
export const LOCAL_PREFIX = 'ollama:';
export const isLocalId = (id) => typeof id === 'string' && id.startsWith(LOCAL_PREFIX);

const MAX_CTX = Number(process.env.OLLAMA_MAX_CTX) || 12288;
const MAX_OUTPUT = Number(process.env.OLLAMA_MAX_OUTPUT) || 6144;
const TEMPERATURE = 0.3;

// Rough, safe-side token estimate for English legal text.
const estimateTokens = (text) => Math.ceil(String(text).length / 3);

export class OllamaError extends Error {
  constructor(code, message, status = 502) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const toModel = (m) => {
  const params = m.details?.parameter_size;
  return {
    id: `${LOCAL_PREFIX}${m.name}`,
    label: m.name,
    tier: 'Local',
    blurb: `Runs on this computer. Free and private${params ? `, ${params} parameters` : ''}.`,
    local: true,
    ollamaName: m.name,
  };
};

// Models that cannot write documents.
const NOT_FOR_WRITING = /embed|rerank/i;

let cache = { at: 0, value: { reachable: false, models: [] } };

export async function listLocalModels({ force = false } = {}) {
  if (!force && Date.now() - cache.at < 4000) return cache.value;
  let value;
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: AbortSignal.timeout(1500) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { models = [] } = await res.json();
    value = { reachable: true, models: models.filter((m) => !NOT_FOR_WRITING.test(m.name)).map(toModel) };
  } catch {
    value = { reachable: false, models: [] };
  }
  cache = { at: Date.now(), value };
  return value;
}

export async function findLocalModel(id) {
  const { models } = await listLocalModels();
  return models.find((m) => m.id === id) ?? null;
}

// Best installed model for drafting. Order reflects speed and quality on a typical laptop GPU;
// set OLLAMA_MODEL to pin one. Code-tuned models are only used as a last resort.
const PREFERRED = ['gemma4:latest', 'gemma4', 'mistral:latest', 'llama3.1:latest', 'qwen2.5:latest', 'llama3.2:latest'];

export function pickDefaultLocal(models) {
  if (!models.length) return null;
  const byName = (name) => models.find((m) => m.ollamaName === name);
  const pinned = process.env.OLLAMA_MODEL?.trim();
  if (pinned && byName(pinned)) return byName(pinned);
  for (const name of PREFERRED) if (byName(name)) return byName(name);
  return models.find((m) => !/coder|code/i.test(m.ollamaName)) ?? models[0];
}

function planBudget(system, user) {
  const prompt = estimateTokens(system) + estimateTokens(user) + 64;
  // Leave room for the answer, but never ask for a context the prompt alone cannot fit in.
  const room = MAX_CTX - prompt;
  if (room < 768) {
    throw new OllamaError('too_long', 'This document is too long for a local model. Select a smaller part of it, or connect Claude for long documents.', 400);
  }
  const numPredict = Math.min(MAX_OUTPUT, room);
  const numCtx = Math.min(MAX_CTX, Math.max(4096, Math.ceil((prompt + numPredict) / 1024) * 1024));
  return { numCtx, numPredict };
}

async function failure(res, model) {
  const text = await res.text().catch(() => '');
  let detail = text;
  try {
    detail = JSON.parse(text).error ?? text;
  } catch {
    /* plain text body */
  }
  if (res.status === 404) {
    return new OllamaError('model', `The model "${model.ollamaName}" is not installed in Ollama. Pick another model in Settings.`, 404);
  }
  if (/memory|cuda|terminated|exit status/i.test(detail)) {
    return new OllamaError('local_memory', `Ollama ran out of memory loading "${model.ollamaName}". Close other apps or choose a smaller local model in Settings.`);
  }
  return new OllamaError('local', `Ollama could not run "${model.ollamaName}". ${String(detail).slice(0, 200)}`.trim());
}

export async function streamOllama({ model, system, user, signal, onText }) {
  const { numCtx, numPredict } = planBudget(system, user);
  let res;
  try {
    res = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        model: model.ollamaName,
        stream: true,
        think: false, // reasoning models would otherwise spend minutes thinking before the first word
        keep_alive: '10m',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        options: { num_ctx: numCtx, num_predict: numPredict, temperature: TEMPERATURE },
      }),
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new OllamaError('not_running', 'Ollama is not running. Open the Ollama app, then try again.');
  }
  if (!res.ok) throw await failure(res, model);

  const decoder = new TextDecoder();
  let buffer = '';
  let last = null;
  const handle = (line) => {
    if (!line.trim()) return;
    const chunk = JSON.parse(line);
    if (chunk.error) throw new OllamaError('local', `Ollama stopped: ${String(chunk.error).slice(0, 200)}`);
    if (chunk.message?.content) onText(chunk.message.content);
    if (chunk.done) last = chunk;
  };

  for await (const part of res.body) {
    buffer += decoder.decode(part, { stream: true });
    let nl;
    while ((nl = buffer.indexOf('\n')) !== -1) {
      handle(buffer.slice(0, nl));
      buffer = buffer.slice(nl + 1);
    }
  }
  handle(buffer);

  if (!last) throw new OllamaError('interrupted', 'Ollama stopped before the draft finished. Try again.');
  return {
    stopReason: last.done_reason === 'length' ? 'max_tokens' : 'end_turn',
    stopDetails: null,
    servedBy: model.id,
    usage: { input: last.prompt_eval_count ?? 0, output: last.eval_count ?? 0 },
  };
}
