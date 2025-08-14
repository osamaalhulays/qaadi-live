"use client";
import { useEffect, useState } from "react";
import JSZip from "jszip";
import { loadHistory, Snapshot } from "../lib/utils/history";

function b64ToBlob(b64: string, type: string) {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new Blob([u8], { type });
}

export default function HistoryPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<Snapshot[]>([]);

  useEffect(() => {
    setItems(loadHistory());
  }, []);

  async function download(item: Snapshot) {
    const blob = b64ToBlob(item.zip, "application/zip");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.target;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function openPath(item: Snapshot, path: string) {
    try {
      const zip = await JSZip.loadAsync(b64ToBlob(item.zip, "application/zip"));
      const file = zip.file(path);
      if (!file) return;
      const blob = await file.async("blob");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {}
  }

  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 320, background: "var(--panel)", borderLeft: "1px solid #242938", padding: 16, overflow: "auto", zIndex: 1000 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <strong>History</strong>
        <button className="btn" onClick={onClose}>×</button>
      </div>
      {items.map((it, idx) => (
        <div key={idx} style={{ marginBottom: 16, borderBottom: "1px solid #242938", paddingBottom: 12 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>{new Date(it.timestamp).toLocaleString()} • {it.target} • {it.lang}</div>
          <div className="actions" style={{ marginBottom: 6 }}>
            <button className="btn" onClick={() => download(it)}>ZIP</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {it.paths.map(p => (
              <button key={p} className="btn" style={{ textAlign: "left" }} onClick={() => openPath(it, p)}>{p}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
