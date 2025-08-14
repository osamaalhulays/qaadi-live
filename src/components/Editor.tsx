"use client";
import type { ChangeEvent } from "react";

interface EditorProps {
  text: string;
  onTextChange: (value: string) => void;
}

export default function Editor({ text, onTextChange }: EditorProps) {
  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    onTextChange(e.target.value);
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <label>النص</label>
      <textarea
        rows={12}
        placeholder="ألصق هنا النص المبعثر…"
        value={text}
        onChange={handleChange}
      />
    </div>
  );
}
