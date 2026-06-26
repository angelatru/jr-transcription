import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import os from "os";
import { transcribeWithChunking, buildTimestampedText, convertToMp3 } from "@/lib/chunker";
import { insertTranscript } from "@/lib/db";

const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"]);

export async function POST(req: NextRequest) {
  const tmpFiles: string[] = [];

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Write uploaded file to temp disk
    const ext = path.extname(file.name).toLowerCase();
    const tmpInput = path.join(os.tmpdir(), `upload-${uuidv4()}${ext}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tmpInput, buffer);
    tmpFiles.push(tmpInput);

    // Convert video to mp3 if needed
    let audioPath = tmpInput;
    if (VIDEO_EXTENSIONS.has(ext)) {
      const tmpMp3 = path.join(os.tmpdir(), `audio-${uuidv4()}.mp3`);
      await convertToMp3(tmpInput, tmpMp3);
      tmpFiles.push(tmpMp3);
      audioPath = tmpMp3;
    }

    const { result } = await transcribeWithChunking(audioPath);

    const id = uuidv4();
    const title = file.name.replace(/\.[^.]+$/, "");
    const timestampsText = buildTimestampedText(result.segments);

    const transcript = {
      id,
      title,
      source: file.name,
      source_type: "file" as const,
      plain_text: result.text,
      timestamps_text: timestampsText || null,
      language: result.language,
      duration: result.segments.length > 0
        ? Math.round(result.segments[result.segments.length - 1].end)
        : null,
      created_at: Date.now(),
    };

    insertTranscript(transcript);

    return NextResponse.json(transcript);
  } catch (err) {
    console.error("Transcription error:", err);
    const message = err instanceof Error ? err.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    for (const f of tmpFiles) {
      try { fs.unlinkSync(f); } catch { /* ignore */ }
    }
  }
}
