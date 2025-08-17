import Header from "../../components/Header";
import Footer from "../../components/Footer";
import QN21Radar from "../../components/QN21Radar";
import QN21Timeline from "../../components/QN21Timeline";

export default function Page() {
  const radar = [
    { label: "QN-21-1", score: 3 },
    { label: "QN-21-2", score: 4 },
    { label: "QN-21-3", score: 2 },
    { label: "QN-21-4", score: 5 },
    { label: "QN-21-5", score: 3 }
  ];
  const timeline = [
    { time: "01", value: 1 },
    { time: "02", value: 2 },
    { time: "03", value: 3 },
    { time: "04", value: 4 },
    { time: "05", value: 5 }
  ];
  return (
    <>
      <Header />
      <div className="card">
        <QN21Radar data={radar} />
        <div style={{ marginTop: 16 }}>
          <QN21Timeline data={timeline} />
        </div>
      </div>
      <Footer />
    </>
  );
}

