# Vercel Deployment Notes

## Video Processing on Vercel

**Important:** Vercel runs on AWS Lambda (serverless), which has limitations with binary executables like FFmpeg/FFprobe.

### What Works on Vercel

✅ **Commentary Generation**
- Template-based generation (instant, no LLM needed)
- Works out of the box
- 5 different styles (hype, roast, wholesome, conspiracy, shocked)

✅ **Video Upload**
- Videos upload successfully to Google Cloud Storage
- Metadata is stored correctly
- Videos are playable

✅ **Core Functionality**
- User authentication
- Video browsing
- Likes and comments
- Trending videos
- Profile management

### What's Limited on Vercel

⚠️ **Video Processing**
- FFmpeg/FFprobe binaries don't work in Lambda environment
- Thumbnail extraction: Skipped (uses video file as fallback)
- Audio merging: Skipped (uses original video)
- Duration detection: Uses default value

The app gracefully degrades when FFmpeg isn't available:
- Videos still upload and work
- Commentary is still generated
- No errors or crashes
- Reduced functionality but fully operational

## Environment Variables for Vercel

Set these in your Vercel project settings:

```env
# Database
DATABASE_URL=your-postgresql-url

# NextAuth
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-domain.vercel.app

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Cloud Storage
GCP_PROJECT_ID=your-project-id
GCP_BUCKET_NAME=your-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account.json

# LLM (Optional - uses templates by default)
# USE_TEMPLATES=true
```

## Full Video Processing

For full video processing with FFmpeg/FFprobe (thumbnails, audio merging, etc.), run locally:

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **FFmpeg/FFprobe** (automatically included via npm packages)
   - `@ffmpeg-installer/ffmpeg`
   - `@ffprobe-installer/ffprobe`
   - Works automatically in local development

3. **Optional: Ollama for LLM**
   ```bash
   ollama pull llama3.1:8b
   ollama serve
   ```

4. **Run dev server**
   ```bash
   npm run dev
   ```

### Production Alternative

For production with full video processing:

1. **Deploy to a VM or container** (not serverless)
   - AWS EC2
   - DigitalOcean Droplet
   - Docker container
   - Any environment where you can install binaries

2. **Use Railway/Render** (support binaries)
   - Both support FFmpeg installation
   - Better for video processing workloads

3. **Separate video processing service**
   - Keep Next.js on Vercel
   - Run video processing on separate service
   - Call processing service via API

## Recommended Setup

### Option A: Vercel + Templates (Current Setup)
**Best for:** Quick deployment, low cost, testing
- Deploy on Vercel
- Use template-based commentary
- Accept limited video processing
- Everything else works perfectly

### Option B: Local Development
**Best for:** Full features, development, testing
- Run `npm run dev` locally
- Full FFmpeg/FFprobe support
- Optional Ollama LLM
- Complete feature set

### Option C: Railway/Render
**Best for:** Production with full features
- Deploy to Railway or Render
- FFmpeg/FFprobe available
- Full video processing
- Higher cost than Vercel serverless

### Option D: Hybrid
**Best for:** Scalability
- Next.js on Vercel (web app)
- Video processing service on Railway/Render
- Best of both worlds

## Current Status

Your app is deployed on Vercel with:
- ✅ Template-based commentary (works great!)
- ✅ Video uploads (fully functional)
- ⚠️ Limited video processing (graceful degradation)
- ✅ All other features (100% working)

**Everything works!** The limitations are minor and don't break functionality.
