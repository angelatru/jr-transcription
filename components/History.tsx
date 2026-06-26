"use client";

import { useState } from "react";
import { TranscriptData } from "./TranscribeInput";

interface Props {
  items: TranscriptData[];
  onSelect: (t: TranscriptData) => void;
  onDelete: (id: string) => void;
  selectedId?: string;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m` : `${s}s`;
}

export default function History({ items, onSelect, onDelete, selectedId }: Props) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (items.length === 0) return null;

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (confirmDelete === id) {
      onDelete(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  }

  return (
    <div>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "12px",
      }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--text-muted)",
        }}>
          History · {items.length}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              borderRadius: "5px",
              cursor: "pointer",
              background: selectedId === item.id ? "var(--surface-2)" : "transparent",
              border: `1px solid ${selectedId === item.id ? "var(--border)" : "transparent"}`,
              transition: "all 0.12s",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              if (selectedId !== item.id) {
                (e.currentTarget as HTMLDivElement).style.background = "var(--surface)";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedId !== item.id) {
                (e.currentTarget as HTMLDivElement).style.background = "transparent";
              }
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                fontWeight: 500,
                color: selectedId === item.id ? "var(--text)" : "#aaa",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginBottom: "2px",
              }}>
                {item.title}
              </div>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--text-muted)",
                display: "flex",
                gap: "8px",
              }}>
                <span>{formatDate(item.created_at)}</span>
                {item.duration && <span>{formatDuration(item.duration)}</span>}
                <span style={{ textTransform: "uppercase" }}>{item.source_type}</span>
              </div>
            </div>

            <button
              onClick={(e) => handleDelete(e, item.id)}
              title={confirmDelete === item.id ? "Click again to confirm" : "Delete"}
              style={{
                flexShrink: 0,
                background: "none",
                border: `1px solid ${confirmDelete === item.id ? "rgba(255,85,85,0.3)" : "transparent"}`,
                borderRadius: "3px",
                padding: "4px 6px",
                cursor: "pointer",
                color: confirmDelete === item.id ? "var(--error)" : "var(--text-dim)",
                transition: "all 0.12s",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
              }}
              onMouseEnter={(e) => {
                if (confirmDelete !== item.id) {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--error)";
                }
              }}
              onMouseLeave={(e) => {
                if (confirmDelete !== item.id) {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-dim)";
                }
              }}
            >
              {confirmDelete === item.id ? "sure?" : <TrashIcon />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}
