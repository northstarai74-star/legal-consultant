import 'dotenv/config';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { MODELS, DEFAULT_MODEL, modelById, serverHasKey, getClient, looksLikeKey, streamClaude, testKey, friendlyError } from './server/ai.js';
import { buildGeneratePrompt, buildRefinePrompt, buildReviewPrompt, ValidationError } from './server/prompts.js';
import { demoDraft, demoReview, streamText } from './server/demo.js';
import { OLLAMA_HOST, isLocalId, listLocalModels, findLocalModel, pickDefaultLocal, streamOllama } from './server/ollama.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';
const START_PORT = Number(process.env.PORT) || 5173;

const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
app.use('/api', express.json({ limit: '2mb' }));

// ---------------------------------------------------------------- helpers

const hits = new Map();
function rateLimit(req, res, next) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const recent = (hits.get(req.ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= 60) {
    return res.status(429).json({ error: 'rate_limit', message: 'Too many requests. Please wait a few minutes.' });
  }
  recent.push(now);
  hits.set(req.ip, recent);
  next();
}

const isLoopback = (addr = '') => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(addr);

function userKeyFrom(req) {
  const raw = req.get('x-anthropic-key');
  return raw && looksLikeKey(raw.trim()) ? raw.trim() : '';
}

// ---------------------------------------------------------------- routes

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/config', async (req, res) => {
  const local = await listLocalModels();
  const localDefault = pickDefaultLocal(local.models);
  const localModels = localDefault ? [localDefault, ...local.models.filter((m) => m !== localDefault)] : [];
  const pick = ({ id, label, tier, blurb, local: isLocal = false }) => ({ id, label, tier, blurb, local: isLocal });
  res.json({
    serverKey: serverHasKey(),
    defaultModel: DEFAULT_MODEL,
    defaultLocalModel: localDefault?.id ?? '',
    models: [...localModels.map(pick), ...MODELS.map(pick)],
    ollama: { reachable: local.reachable, host: OLLAMA_HOST, count: local.models.length },
  });
});

app.post('/api/ai/test', rateLimit, async (req, res) => {
  const key = userKeyFrom(req);
  const client = getClient(key);
  if (!client) return res.status(400).json({ ok: false, code: 'no_key', message: 'No API key to test.' });
  if (!key && !isLoopback(req.socket.remoteAddress) && process.env.ALLOW_REMOTE_AI !== 'true') {
    return res.status(403).json({ ok: false, code: 'remote', message: 'The server key can only be used from the machine running the app.' });
  }
  try {
    await testKey(client);
    res.json({ ok: true });
  } catch (err) {
    const f = friendlyError(err) ?? { status: 500, code: 'internal', message: 'Test failed.' };
    res.status(f.status).json({ ok: false, code: f.code, message: f.message });
  }
});

const TASKS = {
  generate: buildGeneratePrompt,
  refine: buildRefinePrompt,
  review: buildReviewPrompt,
};

app.post('/api/ai/:task', rateLimit, async (req, res) => {
  const task = req.params.task;
  const build = TASKS[task];
  if (!build) return res.status(404).json({ error: 'not_found', message: 'Unknown AI task.' });

  const body = req.body ?? {};
  let prompt;
  try {
    prompt = build(body);
  } catch (err) {
    if (err instanceof ValidationError) return res.status(400).json({ error: 'invalid', message: err.message });
    throw err;
  }

  const demo = body.model === 'demo';
  let model;
  let client;
  if (!demo && isLocalId(String(body.model))) {
    model = await findLocalModel(String(body.model));
    if (!model) {
      return res.status(400).json({ error: 'model', message: 'That local model is not available. Open the Ollama app, then pick a model in Settings.' });
    }
    if (!isLoopback(req.socket.remoteAddress) && process.env.ALLOW_REMOTE_AI !== 'true') {
      return res.status(403).json({ error: 'remote', message: 'Local models can only be used from the machine running the app.' });
    }
  } else if (!demo) {
    model = modelById(String(body.model ?? DEFAULT_MODEL));
    if (!model) return res.status(400).json({ error: 'invalid', message: 'Unknown model.' });
    const key = userKeyFrom(req);
    client = getClient(key);
    if (!client) {
      return res.status(400).json({ error: 'no_key', message: 'Connect your Claude API key in Settings to use Claude models, or pick a local model.' });
    }
    if (!key && !isLoopback(req.socket.remoteAddress) && process.env.ALLOW_REMOTE_AI !== 'true') {
      return res.status(403).json({ error: 'remote', message: 'Add your own Claude API key in Settings to use AI on this server.' });
    }
  } else if (task === 'refine') {
    return res.status(400).json({ error: 'no_key', message: 'AI edits need a connected Claude model. Add your API key in Settings.' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  const send = (event) => !res.writableEnded && res.write(`data: ${JSON.stringify(event)}\n\n`);
  const heartbeat = setInterval(() => !res.writableEnded && res.write(': ping\n\n'), 15000);

  const controller = new AbortController();
  res.on('close', () => {
    clearInterval(heartbeat);
    if (!res.writableEnded) controller.abort();
  });

  send({ type: 'meta', model: demo ? 'demo' : model.id, demo });
  try {
    if (demo) {
      const text = task === 'generate' ? demoDraft(body) : demoReview(String(body.document ?? ''));
      await streamText(text, (t) => send({ type: 'delta', text: t }), controller.signal);
      send({ type: 'done', stopReason: 'end_turn' });
    } else {
      const run = model.local ? streamOllama : streamClaude;
      const result = await run({
        client,
        model,
        system: prompt.system,
        user: prompt.user,
        task,
        signal: controller.signal,
        onText: (t) => send({ type: 'delta', text: t }),
      });
      if (result.stopReason === 'refusal') {
        send({ type: 'error', code: 'refusal', message: 'Claude declined to draft this request. Try rephrasing it or removing sensitive details.' });
      } else {
        send({ type: 'done', stopReason: result.stopReason, truncated: result.stopReason === 'max_tokens', servedBy: result.servedBy, usage: result.usage });
      }
    }
  } catch (err) {
    const f = friendlyError(err);
    if (f) send({ type: 'error', code: f.code, message: f.message });
    if (f?.code === 'internal') console.error('[ai]', err);
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
});

app.use('/api', (req, res) => res.status(404).json({ error: 'not_found', message: 'Not found.' }));

// ---------------------------------------------------------------- frontend

const server = http.createServer(app);

// The standalone landing page lives at /landing.html (web/landing.html); these are friendly aliases.
app.get(['/landing', '/welcome'], (req, res) => res.redirect('/landing.html'));

if (isProd) {
  const dist = path.join(__dirname, 'dist');
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  // Config is passed inline (configFile: false) so Vite does not write temp files that `node --watch` would pick up.
  const { createServer } = await import('vite');
  const { default: viteConfig } = await import('./vite.config.js');
  const vite = await createServer({
    ...viteConfig,
    configFile: false,
    server: { ...viteConfig.server, middlewareMode: true, hmr: { server } },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return res.end();
  res.status(500).json({ error: 'internal', message: 'Internal server error.' });
});

let port = START_PORT;
let retries = 0;
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && retries++ < 20) {
    port += 1;
    server.listen(port);
  } else {
    console.error(err);
    process.exit(1);
  }
});
server.listen(port, () => {
  console.log(`\n  LEGAL LAW studio (${isProd ? 'production' : 'development'})`);
  console.log(`  Local:  http://localhost:${port}/`);
  console.log(`  AI:     ${serverHasKey() ? 'Claude key found in environment' : 'no server key (demo drafter + keys entered in Settings)'}\n`);
});
