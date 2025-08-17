"use client";
import { useEffect, useRef } from "react";

interface Point {
  time: string;
  value: number;
}

interface Props {
  data: Point[];
}

export default function QN21Timeline({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let chart: any;
    const load = async () => {
      const { Chart } = await import("chart.js/auto");
      if (!canvasRef.current) return;
      const labels = data.map(d => d.time);
      const values = data.map(d => d.value);
      chart = new Chart(canvasRef.current, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              data: values,
              borderColor: "#3b82f6",
              fill: false
            }
          ]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    };
    load();
    return () => chart?.destroy?.();
  }, [data]);

  return <canvas ref={canvasRef} />;
}

