import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import fs from "fs";
import path from "path";
import os from "os";
import { transcribeFile, buildTimestampedText, TranscriptionResult, Segment } from "./groq";

// Set ffmpeg path from static binary
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

const MAX_CHUNK_BYTES = 23 * 1024 * 1024; // 23MB, safely under Groq's 25MB limit
const CHUNK_DURATION_SECONDS = 600; // 10 minutes per chunk

export async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration ?? 0);
    });
  });
}

export async function convertToMp3(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec("libmp3lame")
      .audioBitrate(128)
      .noVideo()
      .on("end", () => resolve())
      .on("error", reject)
      .save(outputPath);
  });
}

async function extractChunk(
  inputPath: string,
  outputPath: string,
  startSeconds: number,
  durationSeconds: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startSeconds)
      .setDuration(durationSeconds)
      .audioCodec("libmp3lame")
      .audioBitrate(128)
      .noVideo()
      .on("end", () => resolve())
      .on("error", reject)
      .save(outputPath);
  });
}

export async function transcribeWithChunking(
  filePath: string
): Promise<{ result: TranscriptionResult; needsChunking: boolean }> {
  const stats = fs.statSync(filePath);

  if (stats.size <= MAX_CHUNK_BYTES) {
    const result = await transcribeFile(filePath, 0);
    return { result, needsChunking: false };
  }

  // File is too large — chunk it
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "transcribe-"));
  const allSegments: Segment[] = [];
  const allTexts: string[] = [];
  let language = "unknown";

  try {
    const duration = await getAudioDuration(filePath);
    const numChunks = Math.ceil(duration / CHUNK_DURATION_SECONDS);

    for (let i = 0; i < numChunks; i++) {
      const startSeconds = i * CHUNK_DURATION_SECONDS;
      const chunkPath = path.join(tmpDir, `chunk-${i}.mp3`);

      await extractChunk(filePath, chunkPath, startSeconds, CHUNK_DURATION_SECONDS);

      const chunkResult = await transcribeFile(chunkPath, startSeconds);
      allTexts.push(chunkResult.text);
      allSegments.push(...chunkResult.segments);
      if (i === 0) language = chunkResult.language;

      fs.unlinkSync(chunkPath);
    }
  } finally {
    try { fs.rmdirSync(tmpDir); } catch { /* ignore */ }
  }

  return {
    result: {
      text: allTexts.join(" "),
      segments: allSegments,
      language,
    },
    needsChunking: true,
  };
}

export { buildTimestampedText };
