"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { selectFrameAction } from "@/app/actions/lobby";

interface Frame {
  id: string;
  slug: string;
  name: string;
  category: string;
  configJson: string;
}

export default function FramePicker({
  roomId,
  selectedFrameId,
  isHost,
}: {
  roomId: string;
  selectedFrameId: string | null;
  isHost: boolean;
}) {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/frames");
        if (res.ok) {
          const data = await res.json();
          setFrames(data);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function select(id: string) {
    if (!isHost || pendingId) return;
    setPendingId(id);
    try {
      await selectFrameAction(roomId, id);
    } finally {
      setPendingId(null);
    }
  }

  if (loading) {
    return <div className="frame-picker-loading"><Loader2 className="spin" /> Loading frames...</div>;
  }

  const selected = frames.find((f) => f.id === selectedFrameId) ?? frames[0];

  return (
    <div className="frame-picker">
      <div className="frame-picker-header">
        <h3><Sparkles size={16} /> Choose a Style</h3>
        {!isHost && <span className="host-only-note">Only the host can change this</span>}
      </div>

      <div className="frame-grid">
        {frames.map((frame) => {
          const isSelected = frame.id === selectedFrameId;
          const isPending = frame.id === pendingId;

          return (
            <button
              key={frame.id}
              className={`frame-card ${isSelected ? "selected" : ""}`}
              onClick={() => select(frame.id)}
              disabled={!isHost || isPending}
            >
              <div className={`frame-card-preview theme-${frame.slug}`}>
                {/* Simplified visual rep */}
                <div className="slot-box" />
                <div className="slot-box" />
              </div>
              <div className="frame-card-info">
                <strong>{frame.name}</strong>
                <small>{frame.category}</small>
              </div>
              {isSelected && <div className="frame-check"><Check size={14} /></div>}
              {isPending && <div className="frame-check"><Loader2 size={14} className="spin" /></div>}
            </button>
          );
        })}
      </div>
      
      {selected && (
        <div className="frame-preview-panel">
          <p>Currently selected: <strong>{selected.name}</strong></p>
        </div>
      )}
    </div>
  );
}
