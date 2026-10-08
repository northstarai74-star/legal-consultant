export class AIError extends Error {
  constructor(message, code = 'error') {
    super(message);
    this.code = code;
  }
}

export async function fetchConfig() {
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error('Could not reach the server');
  return res.json();
}

export async function testApiKey(apiKey) {
  const res = await fetch('/api/ai/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-anthropic-key': apiKey } : {}) },
    body: '{}',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new AIError(data.message || 'The test request failed.', data.code);
  return true;
}

// Streams an AI task from the server (Server-Sent Events over fetch).
export async function streamAI(task, body, { apiKey, signal, onMeta, onDelta } = {}) {
  let res;
  try {
    res = await fetch(`/api/ai/${task}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-anthropic-key': apiKey } : {}) },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new AIError('Could not reach the server. Is it still running?', 'network');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new AIError(data.message || `Request failed (${res.status}).`, data.error || 'error');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let done = null;

  const handle = (event) => {
    if (event.type === 'meta') onMeta?.(event);
    else if (event.type === 'delta') onDelta?.(event.text);
    else if (event.type === 'error') throw new AIError(event.message, event.code);
    else if (event.type === 'done') done = event;
  };

  for (;;) {
    const { value, done: finished } = await reader.read();
    if (finished) break;
    buffer += decoder.decode(value, { stream: true });
    let end;
    while ((end = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      for (const line of frame.split('\n')) {
        if (line.startsWith('data:')) handle(JSON.parse(line.slice(5).trim()));
      }
    }
  }

  if (!done) throw new AIError('The connection was interrupted before the draft finished.', 'interrupted');
  return done;
}
