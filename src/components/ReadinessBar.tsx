"use client";
import { useEffect, useState } from "react";

interface Criterion {
  covered?: boolean;
}

interface Props {
  criteria?: Criterion[];
}

export default function ReadinessBar({ criteria }: Props) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (criteria) {
      calc(criteria);
    } else {
      (async () => {
        try {
          const res = await fetch("/paper/judge.json");
          if (res.ok) {
            const j = await res.json();
            if (Array.isArray(j.criteria)) calc(j.criteria);
          }
        } catch {
          setPercent(0);
        }
      })();
    }
  }, [criteria]);

  function calc(list: Criterion[]) {
    const total = list.length;
    const covered = list.filter(c => c.covered).length;
    setPercent(total ? Math.round((covered / total) * 100) : 0);
  }

  return (
    <div className="readiness-bar">
      <div className="label">نسبة الجاهزية: {percent}%</div>
      <div className="bar">
        <div className="fill" style={{ width: `${percent}%` }} />
      </div>
      <style jsx>{`
        .bar { background:#e5e7eb; height:8px; width:100%; border-radius:4px; overflow:hidden; }
        .fill { background:#16a34a; height:100%; }
        .label { margin-bottom:4px; font-size:14px; }
      `}</style>
    </div>
  );
}
