import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { readJSON, writeJSON, uid, DOCS_KEY } from '../lib/storage.js';
import { getJob } from '../lib/jobs.js';
import { useToast } from './ToastContext.jsx';

const DocsContext = createContext(null);
export const useDocs = () => useContext(DocsContext);

const MAX_VERSIONS = 25;
const now = () => new Date().toISOString();

function load() {
  const docs = readJSON(DOCS_KEY, []);
  // A page reload mid-generation leaves a doc stuck in "generating"; surface it as interrupted.
  return docs.map((d) => (d.status === 'generating' && !getJob(`${d.id}:doc`) ? { ...d, status: 'draft', interrupted: true } : d));
}

export function DocsProvider({ children }) {
  const { toast } = useToast();
  const [docs, setDocs] = useState(load);
  const docsRef = useRef(docs);
  docsRef.current = docs;
  const failedOnce = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const ok = writeJSON(DOCS_KEY, docs);
      if (!ok && !failedOnce.current) {
        failedOnce.current = true;
        toast('Browser storage is full or blocked, so your latest changes may not be saved. Export a backup from Settings.', { kind: 'error', duration: 9000 });
      }
    }, 250);
    return () => clearTimeout(t);
  }, [docs, toast]);

  const createDoc = useCallback((fields) => {
    const doc = {
      id: uid(),
      title: 'Untitled document',
      templateId: 'custom',
      content: '',
      status: 'draft',
      model: 'demo',
      versions: [],
      createdAt: now(),
      updatedAt: now(),
      ...fields,
    };
    setDocs((d) => [doc, ...d]);
    return doc;
  }, []);

  const updateDoc = useCallback((id, patch) => {
    setDocs((d) => d.map((x) => (x.id === id ? { ...x, ...(typeof patch === 'function' ? patch(x) : patch), updatedAt: now() } : x)));
  }, []);

  const addVersion = useCallback((id, label, content) => {
    setDocs((d) =>
      d.map((x) => {
        if (x.id !== id) return x;
        const snapshot = content ?? x.content;
        if (!snapshot) return x;
        const versions = [{ id: uid(), at: now(), label, content: snapshot }, ...(x.versions ?? [])].slice(0, MAX_VERSIONS);
        return { ...x, versions };
      }),
    );
  }, []);

  const deleteDoc = useCallback((id) => setDocs((d) => d.filter((x) => x.id !== id)), []);

  const duplicateDoc = useCallback((id) => {
    const src = docsRef.current.find((x) => x.id === id);
    if (!src) return null;
    const copy = { ...src, id: uid(), title: `${src.title} (copy)`, versions: [], createdAt: now(), updatedAt: now(), status: 'draft' };
    setDocs((d) => [copy, ...d]);
    return copy;
  }, []);

  const replaceAll = useCallback((next) => setDocs(next), []);

  const value = useMemo(
    () => ({ docs, createDoc, updateDoc, addVersion, deleteDoc, duplicateDoc, replaceAll, getDoc: (id) => docs.find((d) => d.id === id) }),
    [docs, createDoc, updateDoc, addVersion, deleteDoc, duplicateDoc, replaceAll],
  );

  return <DocsContext.Provider value={value}>{children}</DocsContext.Provider>;
}
