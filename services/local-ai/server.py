from io import BytesIO
import os
import tempfile

import requests
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from TTS.api import TTS


app = FastAPI()

tts_model_name = os.getenv("TTS_MODEL", "tts_models/en/ljspeech/tacotron2-DDC")
ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
ollama_model = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

tts = TTS(model_name=tts_model_name, progress_bar=False, gpu=False)


class ScriptRequest(BaseModel):
    videoTitle: str


class TtsRequest(BaseModel):
    text: str


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/generate-script")
def generate_script(payload: ScriptRequest):
    prompt = (
        "Write one short chaotic Gen-Z style commentary for a video title. "
        "Keep it around 2-4 sentences max. Include meme slang like no cap, fr fr, bussin. "
        f"Video title: {payload.videoTitle}"
    )
    try:
        response = requests.post(
            f"{ollama_url}/api/generate",
            json={"model": ollama_model, "prompt": prompt, "stream": False},
            timeout=60,
        )
        response.raise_for_status()
        data = response.json()
        script = data.get("response", "").strip()
        if not script:
            raise HTTPException(status_code=502, detail="Empty response from local LLM")
        return {"script": script}
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Local LLM request failed: {exc}")


@app.post("/synthesize")
def synthesize(payload: TtsRequest):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmp:
            tts.tts_to_file(text=text, file_path=tmp.name)
            tmp.seek(0)
            wav_buffer = BytesIO(tmp.read())
        wav_buffer.seek(0)
        return StreamingResponse(wav_buffer, media_type="audio/wav")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Local TTS failed: {exc}")
