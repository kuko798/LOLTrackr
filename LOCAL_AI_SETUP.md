# Local AI Setup (Free Self-Hosted Option)

This project can run AI script + TTS generation without OpenAI by using a local service.

## 1. Start local LLM (Ollama)

Install Ollama and run:

```bash
ollama pull llama3.1:8b
ollama serve
```

## 2. Start local AI service

From this repo:

```bash
cd services/local-ai
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001
```

## 3. Configure app env

Set in `.env.local`:

```env
LOCAL_AI_BASE_URL=http://127.0.0.1:8001
```

When `LOCAL_AI_BASE_URL` is set:
- Script generation uses local LLM via `/generate-script`
- Audio generation uses local TTS via `/synthesize`
- OpenAI is not required for this flow

## Script Generation Features

The `/generate-script` endpoint now supports multiple commentary styles:

### Available Styles
- **hype** (default): Energetic, exciting commentary with Gen-Z slang
- **roast**: Playful, sarcastic roasting of the video title
- **wholesome**: Positive, uplifting commentary
- **conspiracy**: Dramatic conspiracy-theory style commentary
- **shocked**: Bewildered, surprised reaction commentary

### Usage Example

```json
POST /generate-script
{
  "videoTitle": "Cat learns to play piano",
  "style": "wholesome"
}
```

### Generation Parameters

The LLM uses optimized parameters for creative, varied output:
- Temperature: 0.9 (high creativity)
- Top-p: 0.95 (nucleus sampling)
- Repeat penalty: 1.2 (reduces repetition)
- Automatic retry with exponential backoff (3 attempts)
- Response validation and cleanup

### Fallback Mode

When `ENABLE_OLLAMA_SCRIPT=false`, the service uses enhanced template-based generation with style support for instant responses without requiring Ollama.

## Notes

- This runs on your own machine, so usage cost is compute only.
- Model downloads are large and first startup can be slow.

## Deploy `server.py` as a hosted service

You can deploy `services/local-ai/server.py` as a separate web service.

### Option A: Railway (recommended)

1. Create a new Railway project from this GitHub repo.
2. Add a new service using the `services/local-ai` directory.
3. Railway should detect `Dockerfile` automatically.
4. Set environment variables on that Railway service:
   - `PORT=8001`
   - `ENABLE_OLLAMA_SCRIPT=false` (default; uses built-in script generator)
   - Optional for Ollama-backed script generation:
     - `ENABLE_OLLAMA_SCRIPT=true`
     - `OLLAMA_URL=http://your-ollama-host:11434`
     - `OLLAMA_MODEL=llama3.1:8b`
5. Deploy and open the service URL.
6. Verify with `GET /health` on the deployed URL.

### Option B: Render

1. New Web Service -> connect your repo.
2. Root directory: `services/local-ai`
3. Environment: Docker.
4. Add the same env vars listed above.
5. Deploy and verify `GET /health`.

## Wire your Next.js app to hosted local AI

In Vercel project env vars:

```env
LOCAL_AI_BASE_URL=https://your-local-ai-service-url
```

After saving env vars, redeploy your Next.js app.
