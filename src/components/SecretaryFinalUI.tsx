"use client";

import { Download } from "lucide-react";
import jsPDF from "jspdf";

export default function SecretaryFinalUI() {
  function handleDownload() {
    const doc = new jsPDF();
    doc.text("Secretary report", 10, 10);
    doc.save("secretary-report.pdf");
  }

  return (
    <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded">
      <Download size={16} />
      <span>Download PDF</span>
    </button>
  );
}
