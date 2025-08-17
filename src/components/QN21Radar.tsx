"use client";
import { useEffect, useRef } from "react";

interface Result {
  label: string;
  score: number;
}

interface Props {
  data: Result[];
}

export default function QN21Radar({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let chart: any;
    const load = async () => {
      const { Chart } = await import("chart.js/auto");
      if (!canvasRef.current) return;
      const labels = data.map(d => d.label);
      const values = data.map(d => d.score);
      chart = new Chart(canvasRef.current, {
        type: "radar",
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: "rgba(16,185,129,0.2)",
              borderColor: "#10b981",
              pointBackgroundColor: "#10b981"
            }
          ]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { r: { beginAtZero: true } }
        }
      });
    };
    load();
    return () => chart?.destroy?.();
  }, [data]);

  return <canvas ref={canvasRef} />;
}

