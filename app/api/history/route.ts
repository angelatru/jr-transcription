import { NextResponse } from "next/server";
import { getAllTranscripts } from "@/lib/db";

export async function GET() {
  try {
    const transcripts = getAllTranscripts();
    return NextResponse.json(transcripts);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
