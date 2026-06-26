import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import ffmpegPath from "ffmpeg-static";
import { transcribeWithChunking, buildTimestampedText } from "@/lib/chunker";
import { insertTranscript } from "@/lib/db";

const execFileAsync = promisify(execFile);

const SUPPORTED_DOMAINS = [
  "youtube.com",
  "youtu.be",
  "instagram.com",
  "tiktok.com",
  "vm.tiktok.com",
];

function isSupported(url: string): boolean {
  try {
    const parsed = new URL(url);
    return SUPPORTED_DOMAINS.some((d) => parsed.hostname.includes(d));
  } catch {
    return false;
  }
}

async function fetchVideoTitle(ytDlpPath: string, url: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(ytDlpPath, [
      "--skip-download",
      "--print", "title",
      "--no-warnings",
      "--no-playlist",
      url,
    ]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

function fallbackTitle(url: string): string {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace("www.", "");
    const ts = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (hostname.includes("youtube") || hostname.includes("youtu.be"))
      return `YouTube – ${ts}`;
    if (hostname.includes("instagram")) return `Instagram – ${ts}`;
    if (hostname.includes("tiktok")) return `TikTok – ${ts}`;
    return `Video – ${ts}`;
  } catch {
    return "Video";
  }
}

async function findYtDlp(): Promise<string> {
  // Try PATH first (works on Linux/Railway and most systems)
  try {
    const { stdout } = await execFileAsync("which", ["yt-dlp"]);
    const found = stdout.trim();
    if (found) return found;
  } catch {
    // ignore
  }
  // macOS Homebrew fallback
  const candidates = [
    "/opt/homebrew/bin/yt-dlp",
    "/usr/local/bin/yt-dlp",
    "/usr/bin/yt-dlp",
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("yt-dlp is not installed. Run: brew install yt-dlp");
}

export async function POST(req: NextRequest) {
  const tmpFiles: string[] = [];

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!isSupported(url)) {
      return NextResponse.json(
        { error: "Only YouTube, Instagram, and TikTok URLs are supported" },
        { status: 400 }
      );
    }

    const ytDlpPath = await findYtDlp();
    const tmpAudio = path.join(os.tmpdir(), `ytdl-${uuidv4()}.mp3`);
    tmpFiles.push(tmpAudio);

    const args = [
      url,
      "--extract-audio",
      "--audio-format", "mp3",
      "--audio-quality", "5",
      "--output", tmpAudio,
      "--no-playlist",
      "--no-warnings",
    ];

    if (ffmpegPath) {
      args.push("--ffmpeg-location", path.dirname(ffmpegPath));
    }

    const [, videoTitle] = await Promise.all([
      execFileAsync(ytDlpPath, args),
      fetchVideoTitle(ytDlpPath, url),
    ]);

    if (!fs.existsSync(tmpAudio)) {
      return NextResponse.json(
        { error: "Failed to download audio from URL" },
        { status: 500 }
      );
    }

    const { result } = await transcribeWithChunking(tmpAudio);

    const id = uuidv4();
    const title = videoTitle ?? fallbackTitle(url);
    const timestampsText = buildTimestampedText(result.segments);

    const transcript = {
      id,
      title,
      source: url,
      source_type: "url" as const,
      plain_text: result.text,
      timestamps_text: timestampsText || null,
      language: result.language,
      duration:
        result.segments.length > 0
          ? Math.round(result.segments[result.segments.length - 1].end)
          : null,
      created_at: Date.now(),
    };

    insertTranscript(transcript);

    return NextResponse.json(transcript);
  } catch (err) {
    console.error("URL transcription error:", err);
    const message =
      err instanceof Error ? err.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    for (const f of tmpFiles) {
      try {
        fs.unlinkSync(f);
      } catch {
        /* ignore */
      }
    }
  }
}
