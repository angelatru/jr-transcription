"use client";

import { useRef, useState } from "react";

type Mode = "file" | "url";

interface Props {
  onTranscript: (transcript: TranscriptData) => void;
}

export interface TranscriptData {
  id: string;
  title: string;
  source: string;
  source_type: "file" | "url";
  plain_text: string;
  timestamps_text: string | null;
  language: string | null;
  duration: number | null;
  created_at: number;
}

export default function TranscribeInput({ onTranscript }: Props) {
  const [mode, setMode] = useState<Mode>("file");
  const [isDragging, setIsDragging] = useState(false);
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function transcribeFile(file: File) {
    setStatus("loading");
    setError("");
    setProgress("Uploading…");

    try {
      const fd = new FormData();
      fd.append("file", file);

      setProgress("Transcribing…");
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Transcription failed");

      onTranscript(data);
      setStatus("idle");
      setProgress("");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Something went wrong");
      setProgress("");
    }
  }

  async function transcribeUrl() {
    if (!url.trim()) return;
    setStatus("loading");
    setError("");
    setProgress("Downloading audio…");

    try {
      const res = await fetch("/api/transcribe-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Transcription failed");

      setProgress("Transcribing…");
      onTranscript(data);
      setUrl("");
      setStatus("idle");
      setProgress("");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Something went wrong");
      setProgress("");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) transcribeFile(file);
  }

  const isLoading = status === "loading";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {/* Mode tabs */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid var(--border)",
        marginBottom: "24px",
      }}>
        {(["file", "url"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(""); }}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "10px 20px 10px 0",
              marginRight: "24px",
              color: mode === m ? "var(--accent)" : "var(--text-muted)",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${mode === m ? "var(--accent)" : "transparent"}`,
              marginBottom: "-1px",
              cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {m === "file" ? "Upload File" : "Paste URL"}
          </button>
        ))}
      </div>

      {mode === "file" ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          style={{
            border: `1px solid ${isDragging ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "6px",
            padding: "48px 32px",
            textAlign: "center",
            cursor: isLoading ? "default" : "pointer",
            background: isDragging ? "var(--accent-dim)" : "var(--surface)",
            transition: "all 0.15s ease",
            userSelect: "none",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/mp4,video/quicktime,video/webm,.mp3,.wav,.m4a,.ogg,.flac,.mp4,.mov,.mkv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) transcribeFile(f);
              e.target.value = "";
            }}
            style={{ display: "none" }}
            disabled={isLoading}
          />

          {isLoading ? (
            <LoadingState progress={progress} />
          ) : (
            <>
              <div style={{
                width: "40px",
                height: "40px",
                margin: "0 auto 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <UploadIcon />
              </div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "15px", marginBottom: "6px" }}>
                Drop an audio or video file
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                mp3 · wav · m4a · flac · mp4 · mov · up to 1 hr
              </p>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ position: "relative" }}>
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && transcribeUrl()}
              placeholder="youtube.com/watch?v=… · instagram.com/p/… · tiktok.com/@…"
              disabled={isLoading}
              style={{
                width: "100%",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "14px 16px",
                color: "var(--text)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--border-bright)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <button
            onClick={transcribeUrl}
            disabled={isLoading || !url.trim()}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "13px 24px",
              borderRadius: "6px",
              border: "none",
              background: isLoading || !url.trim() ? "var(--surface-2)" : "var(--accent)",
              color: isLoading || !url.trim() ? "var(--text-muted)" : "#000",
              fontWeight: 500,
              cursor: isLoading || !url.trim() ? "default" : "pointer",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {isLoading ? (
              <>
                <SpinnerIcon />
                <span>{progress || "Processing…"}</span>
              </>
            ) : "Transcribe"}
          </button>
        </div>
      )}

      {error && (
        <div style={{
          marginTop: "12px",
          padding: "10px 14px",
          background: "rgba(255,85,85,0.08)",
          border: "1px solid rgba(255,85,85,0.2)",
          borderRadius: "5px",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "var(--error)",
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

function LoadingState({ progress }: { progress: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
      <SpinnerIcon size={20} />
      <p style={{
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        color: "var(--text-muted)",
        letterSpacing: "0.04em",
      }}>
        {progress || "Processing…"}
        <span className="animate-blink"> _</span>
      </p>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function SpinnerIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="animate-spin-slow"
      style={{ flexShrink: 0 }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}
