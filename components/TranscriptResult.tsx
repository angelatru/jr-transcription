"use client";

import { useState } from "react";
import { TranscriptData } from "./TranscribeInput";

interface Props {
  transcript: TranscriptData;
}

type OutputMode = "plain" | "timestamps";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TranscriptResult({ transcript }: Props) {
  const [outputMode, setOutputMode] = useState<OutputMode>("plain");
  const [copied, setCopied] = useState(false);

  const hasTimestamps = !!transcript.timestamps_text;
  const text = outputMode === "timestamps" && hasTimestamps
    ? transcript.timestamps_text!
    : transcript.plain_text;

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${transcript.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="animate-fade-up" style={{
      border: "1px solid var(--border)",
      borderRadius: "8px",
      overflow: "hidden",
      background: "var(--surface)",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "16px",
      }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "15px",
            color: "var(--text)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: "4px",
          }}>
            {transcript.title}
          </h3>
          <div style={{
            display: "flex",
            gap: "12px",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--text-muted)",
            flexWrap: "wrap",
          }}>
            {transcript.language && transcript.language !== "unknown" && (
              <span style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                padding: "2px 6px",
                borderRadius: "3px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}>
                {transcript.language}
              </span>
            )}
            {transcript.duration && (
              <span>{formatDuration(transcript.duration)}</span>
            )}
            <span>{formatDate(transcript.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button
            onClick={copy}
            title={copied ? "Copied!" : "Copy to clipboard"}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              padding: "6px 12px",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              background: copied ? "var(--accent-dim)" : "var(--surface-2)",
              color: copied ? "var(--accent)" : "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? "Copied" : "Copy"}
          </button>

          <button
            onClick={download}
            title="Download as .txt"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              padding: "6px 12px",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              background: "var(--surface-2)",
              color: "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <DownloadIcon />
            .txt
          </button>
        </div>
      </div>

      {/* Output mode toggle */}
      {hasTimestamps && (
        <div style={{
          padding: "0 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          gap: "0",
        }}>
          {(["plain", "timestamps"] as OutputMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setOutputMode(m)}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "10px 16px 10px 0",
                marginRight: "20px",
                color: outputMode === m ? "var(--accent)" : "var(--text-muted)",
                background: "none",
                border: "none",
                borderBottom: `1.5px solid ${outputMode === m ? "var(--accent)" : "transparent"}`,
                marginBottom: "-1px",
                cursor: "pointer",
                transition: "color 0.15s",
              }}
            >
              {m === "plain" ? "Plain text" : "Timestamps"}
            </button>
          ))}
        </div>
      )}

      {/* Transcript text */}
      <div style={{
        padding: "20px",
        maxHeight: "480px",
        overflowY: "auto",
      }}>
        <pre style={{
          fontFamily: outputMode === "timestamps" ? "var(--font-mono)" : "var(--font-sans)",
          fontSize: outputMode === "timestamps" ? "12px" : "14px",
          lineHeight: outputMode === "timestamps" ? "1.8" : "1.75",
          color: "var(--text)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {text}
        </pre>
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}
