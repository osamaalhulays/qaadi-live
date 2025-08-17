import Header from "../../components/Header";
import Footer from "../../components/Footer";
import QN21Radar from "../../components/QN21Radar";
import QN21Timeline from "../../components/QN21Timeline";

export default function Page() {
  const radar = [
    { label: "QN-21-11", score: 5 },
    { label: "QN-21-12", score: 4 },
    { label: "QN-21-13", score: 3 },
    { label: "QN-21-14", score: 4 },
    { label: "QN-21-15", score: 2 }
  ];
  const timeline = [
    { time: "01", value: 3 },
    { time: "02", value: 4 },
    { time: "03", value: 5 },
    { time: "04", value: 6 },
    { time: "05", value: 7 }
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

