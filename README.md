# LOLTracker - Brain Rot Video Platform

A video-sharing platform where users can upload videos and generate AI-powered "brain rot" audio overlays using OpenAI TTS. Share and discover chaotic, funny content!

## Features

- 🎥 **Video Upload** - Upload videos with drag-and-drop support
- 🤖 **AI Audio Generation** - Automatic brain rot commentary using OpenAI GPT + TTS
- 🎬 **Video Processing** - FFmpeg-powered audio-video merging
- 👤 **User Authentication** - Secure login and registration
- 📺 **YouTube-like Feed** - Browse and discover videos
- 📊 **User Dashboard** - Manage your uploaded videos
- 👥 **User Profiles** - View other creators' content
- ☁️ **Cloud Storage** - Google Cloud Storage integration
- 🎨 **Modern UI** - Dark theme with glassmorphism and animations

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Vanilla CSS with modern design patterns
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Storage**: Google Cloud Storage
- **AI**: OpenAI GPT-4 + TTS
- **Video Processing**: FFmpeg

## Prerequisites

- Node.js 18+ (v20.9.0+ recommended)
- MongoDB (local or Atlas)
- OpenAI API Key
- Google Cloud Platform account
- FFmpeg installed on your system

### Installing FFmpeg

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get install ffmpeg
```

## Setup Instructions

### 1. Clone and Install

```bash
cd LOLTrackr
npm install
```

### 2. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB locally and start the service
# Connection string: mongodb://localhost:27017/loltrackr
```

**Option B: MongoDB Atlas (Recommended)**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string

### 3. OpenAI API Key

1. Sign up at [OpenAI](https://platform.openai.com/)
2. Create an API key
3. Ensure you have credits for GPT-4 and TTS usage

### 4. Google Cloud Storage Setup

1. Create a GCP project at [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Cloud Storage API
3. Create a storage bucket (e.g., `loltrackr-videos`)
4. Create a service account:
   - Go to IAM & Admin → Service Accounts
   - Create service account with "Storage Admin" role
   - Create and download JSON key
   - Save as `gcp-service-account.json` in project root

5. Make the bucket public (or use signed URLs):
   ```bash
   gsutil iam ch allUsers:objectViewer gs://your-bucket-name
   ```

### 5. Environment Variables

Create `.env.local` file in the root directory:

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/loltrackr

# NextAuth
NEXTAUTH_SECRET=your-random-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Google Cloud Platform
GCP_PROJECT_ID=your-gcp-project-id
GCP_BUCKET_NAME=loltrackr-videos
GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account.json
```

**Generate NextAuth Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign Up** - Create an account at `/auth/signup`
2. **Upload Video** - Go to `/upload` and select a video file
3. **AI Processing** - The system will:
   - Generate a brain rot script using GPT-4
   - Create audio using OpenAI TTS
   - Merge audio with your video using FFmpeg
   - Upload to Google Cloud Storage
4. **Watch & Share** - View your video and share with others!

## Project Structure

```
LOLTrackr/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── auth/            # NextAuth & signup
│   │   ├── videos/          # Video CRUD operations
│   │   └── upload/          # Video upload endpoint
│   ├── auth/                # Authentication pages
│   ├── dashboard/           # User dashboard
│   ├── profile/             # User profiles
│   ├── upload/              # Upload page
│   ├── video/               # Video player page
│   └── page.tsx             # Homepage
├── components/              # React components
│   ├── Navbar.tsx
│   ├── VideoCard.tsx
│   ├── VideoFeed.tsx
│   └── VideoPlayer.tsx
├── lib/                     # Utilities
│   ├── mongodb.ts           # Database connection
│   ├── storage.ts           # GCS integration
│   └── videoProcessor.ts    # FFmpeg & AI processing
├── models/                  # Mongoose models
│   ├── User.ts
│   └── Video.ts
└── public/                  # Static files
```

## API Endpoints

- `POST /api/auth/signup` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth authentication
- `POST /api/upload` - Upload and process video
- `GET /api/videos` - Fetch videos (with filters)
- `GET /api/videos/[id]` - Get single video
- `PUT /api/videos/[id]` - Update video
- `DELETE /api/videos/[id]` - Delete video

## Customization

### Change AI Voice

Edit `lib/videoProcessor.ts`:
```typescript
voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
```

### Modify Brain Rot Style

Edit the system prompt in `lib/videoProcessor.ts` → `generateBrainRotScript()`

### Adjust Video Limits

Edit `app/upload/page.tsx` and `next.config.mjs` for max file size

## Troubleshooting

### FFmpeg Not Found
- Ensure FFmpeg is installed and in your PATH
- Test: `ffmpeg -version`

### MongoDB Connection Error
- Check your connection string
- Verify network access in MongoDB Atlas

### GCS Upload Fails
- Verify service account permissions
- Check bucket name and project ID
- Ensure billing is enabled

### OpenAI API Errors
- Check your API key
- Verify you have available credits
- Check rate limits

## Production Deployment

### Recommended Platforms

- **Vercel** (easiest for Next.js)
- **Railway**
- **DigitalOcean App Platform**
- **AWS / GCP**

### Important Notes

- Set all environment variables in your platform
- Ensure FFmpeg is available in the deployment environment
- Consider using job queues (Bull, BullMQ) for video processing
- Set up proper error monitoring (Sentry, LogRocket)

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

Made with 🔥 and 🧠 (rot)
