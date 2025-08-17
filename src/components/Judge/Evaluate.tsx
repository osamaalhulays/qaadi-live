"use client";

export async function evaluateDraft(
  text: string,
  slug: string,
  headers: any,
  setSelfTest: (res: any) => void,
  setMsg: (msg: string) => void,
  setSelfBusy: (busy: boolean) => void
) {
  setSelfBusy(true);
  setMsg("");
  try {
    const res = await fetch("/api/selftest", {
      method: "POST",
      headers,
      body: JSON.stringify({ slug, sample: text })
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error || "selftest_failed");
    setSelfTest(j);
    setMsg(`Self-Test ${(j.ratio * 100).toFixed(0)}%`);
  } catch (e: any) {
    setMsg(`Self-Test ERROR: ${e?.message || e}`);
  } finally {
    setSelfBusy(false);
  }
}

export default function Judge() {
  return (
    <div>
      <h2>Judge</h2>
      <p>Evaluates drafts.</p>
    </div>
  );
}
