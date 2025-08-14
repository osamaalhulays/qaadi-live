"use client";
import React from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function LanguageSelect({ value, onChange }: Props) {
  return (
    <div>
      <label>Language</label>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="ar">Arabic</option>
        <option value="en">English</option>
        <option value="tr">Turkish</option>
      </select>
    </div>
  );
}
