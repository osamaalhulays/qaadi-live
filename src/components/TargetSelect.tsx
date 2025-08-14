"use client";
import React from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function TargetSelect({ value, onChange }: Props) {
  return (
    <div>
      <label>Target</label>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="general">General</option>
        <option value="science">Science</option>
        <option value="law">Law</option>
      </select>
    </div>
  );
}
