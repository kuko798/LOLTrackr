from io import BytesIO
import os
import random
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
enable_ollama_script = os.getenv("ENABLE_OLLAMA_SCRIPT", "false").lower() == "true"

tts_model = None


class ScriptRequest(BaseModel):
    videoTitle: str
    style: str = "hype"  # Options: hype, roast, wholesome, conspiracy, shocked


class TtsRequest(BaseModel):
    text: str


def get_tts_model():
    global tts_model
    if tts_model is None:
        tts_model = TTS(model_name=tts_model_name, progress_bar=False, gpu=False)
    return tts_model


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/generate-script")
def generate_script(payload: ScriptRequest):
    title = payload.videoTitle.strip()
    if not title:
        raise HTTPException(status_code=400, detail="videoTitle is required")

    if not enable_ollama_script:
        # Enhanced fallback templates with style support
        style = payload.style.lower()

        fallback_templates = {
            "hype": [
                "No cap, this is absolute cinema. We're watching '{title}' and it's hitting different. This is bussin, I'm literally crying.",
                "Fr fr this title is unhinged in the best way. '{title}' just dropped and it's giving main character energy. Certified chaos, 10/10 would watch again.",
                "Deadass this one is about to be peak brain rot. '{title}' is the content we didn't know we needed. I cannot believe this is real, but I'm here for it.",
                "This is it. This is the one. '{title}' is serving pure unfiltered vibes. Absolutely unhinged, love that for us.",
                "Yo, we need to talk about this. '{title}' just went viral in my brain. This slaps harder than it has any right to. No notes."
            ],
            "roast": [
                "Wait, '{title}'? I'm sorry but who approved this? The audacity is sending me, but you know what, it's kinda iconic.",
                "Not '{title}' being a real video title. This is unhinged and I have questions. But fr fr I'm clicking play.",
                "Tell me why '{title}' exists without telling me the internet was a mistake. Actually no, this is peak comedy. I'm obsessed."
            ],
            "wholesome": [
                "This is so wholesome I could cry. '{title}' is exactly the vibe we need right now. Love that for us, truly.",
                "'{title}' just restored my faith in content. This is pure good energy and I'm here for every second of it.",
                "Not me getting emotional over '{title}'. This is the comfort content we all deserve. Absolutely heartwarming."
            ],
            "conspiracy": [
                "Wait... hold up. '{title}' is not what you think it is. I've connected the dots and this goes deeper than you realize. Wake up people.",
                "Okay but hear me out about '{title}'. This is clearly a simulation test and we're all living in it. I have evidence.",
                "They don't want you to know about '{title}'. But I'm exposing the truth. This changes everything."
            ],
            "shocked": [
                "I'm sorry WHAT? '{title}' is a thing that exists? My brain is melting. I can't process this.",
                "Literally '{title}' just appeared on my screen and I have never been more confused. What timeline is this?",
                "HELP. '{title}' broke me. I don't know whether to laugh or cry but it's definitely something."
            ]
        }

        # Get templates for style, default to hype
        templates = fallback_templates.get(style, fallback_templates["hype"])
        selected_script = random.choice(templates).format(title=title)

        return {"script": selected_script}

    # Define different commentary styles
    style_prompts = {
        "hype": f"""You are a chaotic Gen-Z content creator making hype commentary for viral videos.

Video Title: "{title}"

Create a short, energetic commentary (2-3 sentences max) that:
- Opens with immediate hype and engagement
- References the video title naturally
- Uses authentic Gen-Z slang (no cap, fr fr, bussin, deadass, slaps, unhinged, etc.)
- Builds excitement and humor
- Feels spontaneous and genuine, not forced

Make it sound like you're hyped to share this with friends. Keep it snappy and entertaining.

Commentary:""",
        "roast": f"""You are a sarcastic Gen-Z content creator doing playful roast commentary.

Video Title: "{title}"

Create a short, witty roast commentary (2-3 sentences max) that:
- Opens with playful skepticism or confusion
- Roasts or makes fun of the title in a lighthearted way
- Uses Gen-Z humor and slang
- Is funny but not mean-spirited
- Ends with a twist or unexpected compliment

Make it feel like friendly banter with your audience.

Commentary:""",
        "wholesome": f"""You are an enthusiastic Gen-Z content creator making wholesome, positive commentary.

Video Title: "{title}"

Create a short, uplifting commentary (2-3 sentences max) that:
- Opens with genuine excitement and positivity
- Celebrates what's wholesome or heartwarming about the content
- Uses Gen-Z slang but keeps it positive (slaps, vibes, love that for us, etc.)
- Spreads good energy
- Feels authentic and warm

Make your audience feel good about watching this.

Commentary:""",
        "conspiracy": f"""You are a dramatic Gen-Z content creator making conspiracy-style commentary.

Video Title: "{title}"

Create a short, dramatic conspiracy commentary (2-3 sentences max) that:
- Opens with "Wait..." or "Hold up..." to create intrigue
- Presents a humorous conspiracy theory about the video
- Uses Gen-Z slang mixed with dramatic language
- Builds suspense playfully
- Feels unhinged in the best way

Make it feel like you're uncovering the truth.

Commentary:""",
        "shocked": f"""You are a bewildered Gen-Z content creator making shocked reaction commentary.

Video Title: "{title}"

Create a short, shocked commentary (2-3 sentences max) that:
- Opens with disbelief or confusion
- Expresses genuine surprise at the video title
- Uses Gen-Z slang and reaction language (literally, I can't, what, help, etc.)
- Builds on the absurdity
- Feels like a genuine shocked reaction

Make it sound like you can't believe what you're seeing.

Commentary:"""
    }

    # Get the prompt for the requested style, default to hype
    style = payload.style.lower()
    prompt = style_prompts.get(style, style_prompts["hype"])

    # Retry mechanism with exponential backoff
    import time
    max_retries = 3
    retry_delay = 1  # seconds

    last_error = None
    script = ""

    for attempt in range(max_retries):
        try:
            response = requests.post(
                f"{ollama_url}/api/generate",
                json={
                    "model": ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.9,  # Higher creativity
                        "top_p": 0.95,       # Nucleus sampling for variety
                        "top_k": 50,         # Consider top 50 tokens
                        "repeat_penalty": 1.2  # Reduce repetition
                    }
                },
                timeout=60,
            )
            response.raise_for_status()
            data = response.json()
            script = data.get("response", "").strip()

            # If we got a valid response, break out of retry loop
            if script and len(script) >= 20:
                break
            else:
                last_error = "Response too short or empty"
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                continue

        except requests.RequestException as exc:
            last_error = str(exc)
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            continue
    else:
        # All retries failed
        raise HTTPException(
            status_code=502,
            detail=f"Local LLM failed after {max_retries} attempts: {last_error}"
        )

    # Clean up the response
    # Remove common LLM artifacts
    cleanup_prefixes = ["commentary:", "script:", "here's", "sure,"]
    script_lower = script.lower()
    for prefix in cleanup_prefixes:
        if script_lower.startswith(prefix):
            script = script[len(prefix):].strip()
            script_lower = script.lower()

    # Remove quotes if the entire response is wrapped in them
    if (script.startswith('"') and script.endswith('"')) or \
       (script.startswith("'") and script.endswith("'")):
        script = script[1:-1].strip()

    # Validate response quality
    if not script:
        raise HTTPException(status_code=502, detail="Empty response from local LLM")

    if len(script) < 20:
        raise HTTPException(status_code=502, detail="Response too short (minimum 20 characters)")

    if len(script) > 500:
        # Truncate if too long, keep first 2-3 sentences
        sentences = script.split('. ')
        script = '. '.join(sentences[:3])
        if not script.endswith('.'):
            script += '.'

    # Check for minimum engagement - should have at least some Gen-Z vibes
    # This is a soft check - we don't reject, just log a warning
    has_engagement = any(word in script.lower() for word in [
        'no cap', 'fr', 'bussin', 'deadass', 'slaps', 'vibes', 'unhinged',
        'crying', 'literally', 'iconic', 'peak', 'cinema', 'chaos'
    ])

    if not has_engagement and enable_ollama_script:
        # Could log this for monitoring
        print(f"Warning: Generated script may lack Gen-Z engagement: {script[:50]}...")

    return {"script": script}


@app.post("/synthesize")
def synthesize(payload: TtsRequest):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    try:
        tts = get_tts_model()
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmp:
            tts.tts_to_file(text=text, file_path=tmp.name)
            tmp.seek(0)
            wav_buffer = BytesIO(tmp.read())
        wav_buffer.seek(0)
        return StreamingResponse(wav_buffer, media_type="audio/wav")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Local TTS failed: {exc}")
