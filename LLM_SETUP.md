# LLM Setup for LOL Tracker

Your LOL Tracker now generates brain rot commentary using **your own LLM** - no external services or API keys required!

## Quick Start

### Option 1: Use Ollama (Recommended)

1. **Install Ollama**
   ```bash
   # Download from https://ollama.ai
   # Or use: winget install Ollama.Ollama
   ```

2. **Download a model**
   ```bash
   ollama pull llama3.1:8b
   ```

3. **Start Ollama**
   ```bash
   ollama serve
   ```

4. **Configure your app**

   Your `.env.local` is already configured:
   ```env
   OLLAMA_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.1:8b
   ```

5. **That's it!** Your app will now generate commentary using Ollama

### Option 2: Use Templates (No LLM Required)

If you don't want to run an LLM, use our enhanced templates:

1. **Update `.env.local`**
   ```env
   USE_TEMPLATES=true
   ```

2. **Done!** Fast, reliable commentary without any LLM

## How It Works

### Script Generation
- **With Ollama**: App connects directly to your local Ollama instance
- **Fallback**: If Ollama fails, automatically uses templates
- **5 Styles**: hype, roast, wholesome, conspiracy, shocked
- **Random Selection**: Each video gets a random style for variety

### Audio/TTS (Optional)
- **Default**: Videos process without voice narration
- **With TTS**: Set `TTS_SERVICE_URL` to enable voice commentary
- **Standalone**: Audio generation is completely optional

## Features

✅ **No External Dependencies**: Everything runs locally
✅ **No API Keys**: No OpenAI, no cloud services
✅ **Smart Fallback**: Ollama → Templates (always works)
✅ **5 Commentary Styles**: Varied, engaging content
✅ **Quality Validation**: Automatic cleanup and validation
✅ **Retry Logic**: 3 attempts with exponential backoff

## Configuration Options

### Environment Variables

```env
# Use your LLM (Ollama)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# OR use templates (no LLM)
USE_TEMPLATES=true

# Optional: Add voice narration
TTS_SERVICE_URL=http://localhost:8001
```

### Available Ollama Models

- `llama3.1:8b` (recommended) - Fast, good quality
- `llama3.1:70b` - Best quality, slower
- `llama2:13b` - Alternative option
- `mistral` - Lightweight alternative

```bash
ollama pull llama3.1:8b
```

## Troubleshooting

### "Ollama connection failed"
- Check Ollama is running: `ollama serve`
- Verify URL: `http://localhost:11434`
- Test: `curl http://localhost:11434/api/version`

### "Model not found"
```bash
ollama pull llama3.1:8b
```

### Want faster generation?
```env
USE_TEMPLATES=true
```

### Videos process but no commentary?
- Check browser console for errors
- Verify Ollama is responding
- Fallback to templates should work automatically

## Example Commentary Output

### Hype Style
> "No cap, this is absolute cinema. We're watching 'Epic Gaming Fails' and it's hitting different. This is bussin, I'm literally crying."

### Roast Style
> "Wait, 'Epic Gaming Fails'? I'm sorry but who approved this? The audacity is sending me, but you know what, it's kinda iconic."

### Wholesome Style
> "This is so wholesome I could cry. 'Epic Gaming Fails' is exactly the vibe we need right now. Love that for us, truly."

### Conspiracy Style
> "Wait... hold up. 'Epic Gaming Fails' is not what you think it is. I've connected the dots and this goes deeper than you realize. Wake up people."

### Shocked Style
> "I'm sorry WHAT? 'Epic Gaming Fails' is a thing that exists? My brain is melting. I can't process this."

## Advanced Configuration

### Custom LLM Endpoint
If you're using a different LLM service:
```env
OLLAMA_URL=http://your-custom-llm:port
OLLAMA_MODEL=your-model-name
```

### Temperature and Creativity
The app uses optimized parameters:
- Temperature: 0.9 (high creativity)
- Top-p: 0.95 (nucleus sampling)
- Repeat penalty: 1.2 (reduces repetition)

These are hardcoded in `lib/videoProcessor.ts` but can be customized.

## Performance

- **Template Mode**: Instant (<1ms)
- **Ollama (8B model)**: 2-5 seconds
- **Ollama (70B model)**: 10-30 seconds
- **With Retry**: Up to 3 attempts if needed

## Architecture

```
Video Upload
    ↓
Generate Script (5 styles, random selection)
    ↓
Try Ollama → Success? → Use LLM script
    ↓ Fail?
Template Fallback → Always works
    ↓
Process Video (with or without TTS)
    ↓
Done!
```

## What Changed?

### Before
- Required separate Python service (`LOCAL_AI_BASE_URL`)
- Complex setup with Docker/hosted deployment
- TTS and script generation tightly coupled

### Now
- Direct Ollama connection from Next.js
- Simple `.env` configuration
- TTS optional and independent
- Template fallback always available
- No external services required

## Summary

**Minimum Setup**: Enable `USE_TEMPLATES=true` → Done!
**Recommended Setup**: Install Ollama, pull model, start server → Better quality!
**Advanced Setup**: Add TTS service → Voice narration!

Your app will **always work** thanks to smart fallback logic. 🎉
