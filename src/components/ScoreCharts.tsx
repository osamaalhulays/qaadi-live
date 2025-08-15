"use client";
import { useEffect, useRef, useState } from "react";

interface Criterion {
  id: number;
  name: string;
  score: number;
  type?: "internal" | "external";
  covered?: boolean;
}

interface Props {
  criteria?: Criterion[];
}

export default function ScoreCharts({ criteria }: Props) {
  const [data, setData] = useState<Criterion[]>(criteria || []);
  const barRef = useRef<HTMLCanvasElement | null>(null);
  const radarRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (criteria) setData(criteria);
    else {
      (async () => {
        try {
          const res = await fetch("/paper/judge.json");
          if (res.ok) {
            const j = await res.json();
            if (Array.isArray(j.criteria)) setData(j.criteria);
          }
        } catch {
          setData([]);
        }
      })();
    }
  }, [criteria]);

  useEffect(() => {
    let bar: any;
    let radar: any;

    const load = async () => {
      if (typeof window === "undefined" || !data.length) return;
      const w = window as any;
      if (!w.Chart) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js";
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        }).catch(() => {});
      }
      const Chart = (window as any).Chart;
      if (!Chart) return;

      const labels = data.map(c => c.name);
      const scores = data.map(c => c.score);
      const colors = data.map(c =>
        c.covered ? "#16a34a" : c.type === "external" ? "#1d4ed8" : "#dc2626"
      );

      if (barRef.current) {
        bar = new Chart(barRef.current, {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                data: scores,
                backgroundColor: colors
              }
            ]
          },
          options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }
        });
      }

      if (radarRef.current) {
        radar = new Chart(radarRef.current, {
          type: "radar",
          data: {
            labels,
            datasets: [
              {
                data: scores,
                backgroundColor: "rgba(59,130,246,0.2)",
                borderColor: "#3b82f6",
                pointBackgroundColor: colors
              }
            ]
          },
          options: {
            plugins: { legend: { display: false } },
            scales: { r: { beginAtZero: true } }
          }
        });
      }
    };

    load();
    return () => {
      bar?.destroy?.();
      radar?.destroy?.();
    };
  }, [data]);

  return (
    <div className="score-charts">
      <div className="legend">
        <span><span className="box internal" /> داخلي</span>
        <span><span className="box external" /> خارجي</span>
        <span><span className="box covered" /> مكتمل</span>
      </div>
      <div className="chart-wrapper"><canvas ref={barRef} /></div>
      <div className="chart-wrapper"><canvas ref={radarRef} /></div>
      <style jsx>{`
        .legend { display:flex; gap:12px; margin-bottom:8px; }
        .box { display:inline-block; width:12px; height:12px; margin-right:4px; }
        .internal { background:#dc2626; }
        .external { background:#1d4ed8; }
        .covered { background:#16a34a; }
        .chart-wrapper { margin-bottom:16px; }
      `}</style>
    </div>
  );
}
