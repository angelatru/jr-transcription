"use client";

import { useEffect, useState } from "react";
import TranscribeInput, { TranscriptData } from "@/components/TranscribeInput";
import TranscriptResult from "@/components/TranscriptResult";
import History from "@/components/History";

export default function Home() {
  const [current, setCurrent] = useState<TranscriptData | null>(null);
  const [history, setHistory] = useState<TranscriptData[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (Array.isArray(data)) setHistory(data);
    } catch {
      // silently fail
    }
  }

  function handleNewTranscript(t: TranscriptData) {
    setCurrent(t);
    setHistory((prev) => [t, ...prev.filter((h) => h.id !== t.id)]);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/history/${id}`, { method: "DELETE" });
    setHistory((prev) => prev.filter((h) => h.id !== id));
    if (current?.id === id) setCurrent(null);
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        padding: "0 32px",
        height: "52px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        background: "var(--bg)",
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <WaveformLogo />
          <span style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "-0.01em",
            color: "var(--text)",
          }}>
            transcribe
          </span>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--accent)",
            background: "var(--accent-dim)",
            border: "1px solid rgba(163,230,53,0.2)",
            padding: "2px 6px",
            borderRadius: "3px",
            letterSpacing: "0.06em",
          }}>
            whisper
          </span>
        </div>

        <button
          onClick={() => setHistoryOpen((v) => !v)}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.06em",
            padding: "6px 12px",
            background: historyOpen ? "var(--surface-2)" : "none",
            border: `1px solid ${historyOpen ? "var(--border)" : "transparent"}`,
            borderRadius: "4px",
            color: history.length ? "var(--text-muted)" : "var(--text-dim)",
            cursor: "pointer",
            transition: "all 0.12s",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <HistoryIcon />
          History
          {history.length > 0 && (
            <span style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              padding: "0 5px",
              borderRadius: "3px",
              fontSize: "10px",
            }}>
              {history.length}
            </span>
          )}
        </button>
      </header>

      {/* Main layout */}
      <div style={{
        flex: 1,
        display: "flex",
        maxWidth: "1100px",
        width: "100%",
        margin: "0 auto",
        padding: "40px 32px",
        gap: "40px",
        alignItems: "flex-start",
      }}>
        {/* Left column */}
        <main style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}>
          {/* Hero */}
          <div style={{ marginBottom: "8px" }}>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "clamp(28px, 4vw, 40px)",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "var(--text)",
              marginBottom: "10px",
            }}>
              Audio and Content Transcription<br />
              <span style={{ color: "var(--accent)" }}>for julian :3</span>
            </h1>
            <p style={{
              fontFamily: "var(--font-sans)",
              fontSize: "14px",
              color: "var(--text-muted)",
              fontWeight: 300,
              lineHeight: 1.6,
            }}>
              Upload any audio or video file, or paste a YouTube / Instagram / TikTok link.
              Auto-detects language. Up to 1 hour.
            </p>
          </div>

          <TranscribeInput onTranscript={handleNewTranscript} />

          {current && <TranscriptResult transcript={current} />}
        </main>

        {/* Right sidebar — history */}
        {historyOpen && history.length > 0 && (
          <aside
            className="animate-fade-up"
            style={{
              width: "260px",
              flexShrink: 0,
              position: "sticky",
              top: "80px",
            }}
          >
            <History
              items={history}
              onSelect={(t) => { setCurrent(t); }}
              onDelete={handleDelete}
              selectedId={current?.id}
            />
          </aside>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "var(--text-dim)",
          letterSpacing: "0.06em",
        }}>
          GROQ · WHISPER LARGE-V3-TURBO
        </span>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "var(--text-dim)",
        }}>
          50+ languages · auto-detect
        </span>
      </footer>
    </div>
  );
}

function WaveformLogo() {
  const bars = [3, 6, 9, 12, 8, 5, 10, 14, 7, 4];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.5px", height: "18px" }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: "2px",
            height: `${h}px`,
            background: "var(--accent)",
            borderRadius: "1px",
            opacity: 0.7 + (i % 3) * 0.1,
          }}
        />
      ))}
    </div>
  );
}

function HistoryIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
