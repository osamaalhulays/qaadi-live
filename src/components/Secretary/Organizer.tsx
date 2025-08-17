"use client";
import { latestFilesFor } from "../../lib/utils/manifest";

export async function organizeDraft(
  slug: string,
  v: string,
  setFiles: (files: string[]) => void,
  setJudge: (judge: any) => void,
  refreshCriteriaList: () => Promise<void>
) {
  try {
    const res = await fetch("/snapshots/manifest.json");
    if (!res.ok) {
      setFiles([]);
    } else {
      const list = await res.json();
      if (Array.isArray(list) && list.length) {
        const fl = latestFilesFor(list, slug, v);
        setFiles(fl);
      } else setFiles([]);
    }
  } catch {
    setFiles([]);
  }
  try {
    const jr = await fetch("/paper/judge.json");
    if (jr.ok) {
      const jj = await jr.json();
      setJudge(jj);
    } else setJudge(null);
  } catch {
    setJudge(null);
  }
  await refreshCriteriaList();
}

export default function Secretary() {
  return (
    <div>
      <h2>Secretary</h2>
      <p>Organizes draft files.</p>
    </div>
  );
}
