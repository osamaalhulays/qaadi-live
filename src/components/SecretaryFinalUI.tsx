"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default function SecretaryFinalUI() {
  const [text, setText] = useState("مرحبا بالعالم");

  async function exportPDF() {
    const doc = new jsPDF();
    const fontUrl = "/fonts/Amiri-Regular.ttf";
    try {
      const font = await fetch(fontUrl).then((res) => res.arrayBuffer());
      const fontBase64 = arrayBufferToBase64(font);
      doc.addFileToVFS("Amiri-Regular.ttf", fontBase64);
      doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
      doc.setFont("Amiri");
    } catch (err) {
      console.error("Failed to load font", err);
    }
    doc.text(text, 10, 10, { lang: "ar" });
    doc.save("secretary.pdf");
  }

  return (
    <div className="space-y-4">
      <textarea
        className="w-full border p-2"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={exportPDF}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        تصدير PDF
      </button>
    </div>
  );
}
