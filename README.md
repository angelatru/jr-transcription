# transcribe

Accurate audio & video transcription via Groq's Whisper large-v3-turbo. Supports audio file uploads and YouTube / Instagram / TikTok links. Transcripts saved in local SQLite.

## Setup

### 1. Get a free Groq API key

Sign up at [console.groq.com](https://console.groq.com) → API Keys → Create key. Free tier gives ~2 hrs/day.

### 2. Configure environment

```bash
cp .env.local.example .env.local
# edit .env.local and paste your key
```

### 3. Install yt-dlp (required for video URL support)

```bash
brew install yt-dlp   # macOS
# or: pip install yt-dlp
```

### 4. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Audio files**: mp3, wav, m4a, flac, ogg — drag & drop or click to upload
- **Video files**: mp4, mov, mkv, webm — auto-converts to audio
- **Video URLs**: YouTube, Instagram, TikTok — paste and transcribe
- **Auto-detects language** — 50+ languages via Whisper
- **Chunking** — files up to 1 hour auto-split at 10-minute boundaries
- **Two output modes** — plain text or text with timestamps (`[00:01:23]`)
- **Export** — copy to clipboard or download as `.txt`
- **History** — all transcripts saved in local SQLite, persists across sessions

## Deploy to Railway

1. Push to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add environment variable: `GROQ_API_KEY`
4. Add a **Volume** mounted at `/app/data` so the SQLite database persists across deploys
5. Deploy — `railway.toml` handles yt-dlp installation automatically

## Limits

- Groq free tier: ~2 hours/day, rate limited
- Files over 25MB are chunked automatically (ffmpeg is bundled)
- Video URL downloads require `yt-dlp` installed on your system
