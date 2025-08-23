import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QN21Radar from "@/components/QN21Radar";
import QN21Timeline from "@/components/QN21Timeline";
import Judge from "@/components/Judge";

export default function Page() {
  const radar = [
    { label: "QN-21-6", score: 4 },
    { label: "QN-21-7", score: 3 },
    { label: "QN-21-8", score: 5 },
    { label: "QN-21-9", score: 2 },
    { label: "QN-21-10", score: 4 }
  ];
  const timeline = [
    { time: "01", value: 2 },
    { time: "02", value: 3 },
    { time: "03", value: 4 },
    { time: "04", value: 5 },
    { time: "05", value: 6 }
  ];
  return (
    <>
      <Header />
      <div className="card">
        <QN21Radar data={radar} />
        <div style={{ marginTop: 16 }}>
          <QN21Timeline data={timeline} />
        </div>
        <Judge />
      </div>
      <Footer />
    </>
  );
}

