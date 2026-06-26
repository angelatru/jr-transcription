import Groq from "groq-sdk";
import fs from "fs";

let client: Groq | null = null;

function getClient(): Groq {
  if (client) return client;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set in environment variables");
  client = new Groq({ apiKey });
  return client;
}

export interface Segment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  text: string;
  segments: Segment[];
  language: string;
}

// verbose_json returns more fields than the SDK types expose
interface VerboseTranscription {
  text: string;
  language?: string;
  segments?: Array<{ start?: number; end?: number; text: string }>;
}

export async function transcribeFile(
  filePath: string,
  offsetSeconds = 0
): Promise<TranscriptionResult> {
  const groq = getClient();
  const fileStream = fs.createReadStream(filePath);

  const raw = await groq.audio.transcriptions.create({
    file: fileStream,
    model: "whisper-large-v3-turbo",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  const verbose = raw as unknown as VerboseTranscription;

  const segments: Segment[] = (verbose.segments ?? []).map((s) => ({
    start: (s.start ?? 0) + offsetSeconds,
    end: (s.end ?? 0) + offsetSeconds,
    text: s.text,
  }));

  return {
    text: verbose.text,
    segments,
    language: verbose.language ?? "unknown",
  };
}

export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function buildTimestampedText(segments: Segment[]): string {
  return segments
    .map((seg) => `[${formatTimestamp(seg.start)}] ${seg.text.trim()}`)
    .join("\n");
}
