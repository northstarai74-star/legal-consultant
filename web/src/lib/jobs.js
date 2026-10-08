import { useSyncExternalStore } from 'react';
import { streamAI, AIError } from './api.js';

// Streaming AI jobs live outside React so they keep running when you navigate between pages.
const jobs = new Map();
const listeners = new Set();
let version = 0;
let timer = null;

function emit(immediate = false) {
  const fire = () => {
    timer = null;
    version += 1;
    listeners.forEach((l) => l());
  };
  if (immediate) {
    if (timer) clearTimeout(timer);
    fire();
  } else if (!timer) {
    timer = setTimeout(fire, 50);
  }
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getVersion = () => version;

export const getJob = (key) => jobs.get(key);

export function useJob(key) {
  useSyncExternalStore(subscribe, getVersion);
  return jobs.get(key);
}

export function clearJob(key) {
  jobs.delete(key);
  emit(true);
}

// key identifies the surface the job belongs to, e.g. "<docId>:doc" or "<docId>:review".
export function startJob({ key, task, body, apiKey, onDone, onError }) {
  const existing = jobs.get(key);
  if (existing?.status === 'running') return existing;

  const controller = new AbortController();
  const job = { key, task, status: 'running', text: '', error: null, meta: null, startedAt: Date.now(), stop: () => controller.abort() };
  jobs.set(key, job);
  emit(true);

  streamAI(task, body, {
    apiKey,
    signal: controller.signal,
    onMeta: (meta) => {
      job.meta = meta;
      emit(true);
    },
    onDelta: (text) => {
      job.text += text;
      emit();
    },
  })
    .then((result) => {
      job.status = 'done';
      job.result = result;
      emit(true);
      onDone?.(job);
    })
    .catch((err) => {
      if (err.name === 'AbortError') {
        job.status = 'stopped';
        emit(true);
        onDone?.(job);
        return;
      }
      job.status = 'error';
      job.error = err instanceof AIError ? err : new AIError('Something went wrong.', 'error');
      emit(true);
      onError?.(job);
    });

  return job;
}
