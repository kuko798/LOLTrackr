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

## Notes

- This runs on your own machine, so usage cost is compute only.
- Model downloads are large and first startup can be slow.
