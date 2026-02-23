# LLM Integration (Local / OpenAI / Anthropic)

This project includes a provider-agnostic LLM service used to generate short,
deterministic narratives for water stations. The backend can target a local LM
Studio server (OpenAI-compatible), the OpenAI API, or Anthropic via a single
environment variable.

Quick setup (backend):

1. Install SDKs for the supported providers:

```powershell
cd backend
npm install openai @anthropic-ai/sdk
```

2. Configure environment (copy `backend/.env.example` → `backend/.env`) and set:

- `LLM_PROVIDER` = `local` | `openai` | `anthropic`
- For local LM Studio:
  - `LLM_LOCAL_BASE_URL` — default: `http://localhost:1234/v1`
  - `LLM_LOCAL_MODEL` — default: `mistral-7b-instruct-v0.3` (must be loaded in LM Studio)
- For OpenAI:
  - `OPENAI_API_KEY`, `OPENAI_MODEL`
- For Anthropic:
  - `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`

3. Start LM Studio local server (if using `local`) and ensure the model is loaded.

4. Restart the backend:

```powershell
# from repo root
cd backend
npm run start:dev
```

Endpoints exposed:

- `GET /intelligence/narrative?stationId=XXXX&stationName=optional` — generate a narrative (opt-in)
- `GET /intelligence/llm-status` — returns `{ provider, model, available }`

Implementation notes:

- The LLM call uses `temperature: 0.3` and `max_tokens: 600` for all providers.
- Output is always passed through `stripPreamble()` to defensively remove
  occasional Mistral prepended text.
- Switching providers requires only changing `LLM_PROVIDER` and restarting the backend.
- If the LM Studio local server is unavailable, the API will return a descriptive
  error instructing you to start LM Studio and load the specified model.
