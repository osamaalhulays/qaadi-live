"use client";

export function mergeBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DepartmentHead() {
  return (
    <div>
      <h2>Department Head</h2>
      <p>Merges and prepares documents.</p>
    </div>
  );
}
