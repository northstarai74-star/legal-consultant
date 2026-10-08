# LEGAL LAW — AI Document Studio

A web app for creating legal documents with AI. Pick a document type (NDA, employment, lease, loan, legal notice and more), answer a few guided questions, and Claude drafts the full document live. Then edit it in place, rewrite any clause with AI, run an AI risk review, and export to Word, PDF or text.

## Run it

```bash
npm install
npm run dev        # development, with hot reload — prints the local URL (default http://localhost:5173)
npm run build      # production build into dist/
npm start          # serve the production build
```

One process serves both the API and the UI, so there is only one port. If the port is busy it tries the next one. Set `PORT` to choose another.

## Use a local model (Ollama)

Install [Ollama](https://ollama.com), open it, and download a model (for example `ollama pull gemma4`). The app finds every model you have installed and uses a local one by default, so drafting, rewriting and review run on your computer. It is free and works offline, and no document text leaves the machine. No API key is needed.

- Pick a model in **Settings** or from the model menu in the editor. Set `OLLAMA_MODEL` in `.env` to choose the default, and `OLLAMA_HOST` if Ollama runs elsewhere.
- Bigger models write better but are slower and need more memory. On a laptop with a 6 GB graphics card, `gemma4:latest` is a good balance; a 12B model can run out of memory.
- Local models can only be used from the machine running the app unless `ALLOW_REMOTE_AI=true`.

## Connect Claude (optional)

Without a local model or a key the app runs in **demo mode**: an offline drafter fills the built-in clause library with your answers. To also draft, rewrite and review with Claude in the cloud:

- **In the app:** Settings → paste your Claude API key. It is stored in your browser only and sent to this app's server per request; the server never logs or stores it.
- **On the server:** copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`. The server key is only usable from the machine running the app unless `ALLOW_REMOTE_AI=true`.

Models offered: Claude Fable 5.1 (default, the most capable), Opus 5.5, Sonnet 5.5 and Haiku 4.5. Refusal fallback is enabled for the models that support it; set `ANTHROPIC_FALLBACKS=off` to disable it.

## What's inside

| Path | Purpose |
| --- | --- |
| `server.js`, `server/` | Express server: SSE streaming endpoints (`/api/ai/generate`, `refine`, `review`), model catalogue, prompts, offline demo drafter |
| `shared/templates/` | Document types: form fields + clause library, shared by the UI, the AI prompts and the demo drafter |
| `web/` | React + Vite front end (dashboard, template gallery, guided form, editor, library, settings) |
| `legacy/` | The previous case-management API, kept for reference. Not used. |

To add a document type, create a file in `shared/templates/` (copy `nda.js`) and register it in `shared/templates/index.js`.

## Notes

- Documents are saved in the browser (localStorage). Use Settings → Export backup to keep or move them. There are no accounts or cloud sync yet.
- AI output is a draft, not legal advice. The app says so on every document; have a qualified lawyer review anything important.
