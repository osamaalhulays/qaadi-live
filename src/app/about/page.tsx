"use client";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useLanguage } from "../../components/LangDirProvider";

export default function AboutPage() {
  const { t } = useLanguage();
  return (
    <>
      <Header />
      <main style={{ padding: 16 }}>{t("about.content")}</main>
      <Footer />
    </>
  );
}
