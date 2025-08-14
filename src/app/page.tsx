"use client";

import Header from "../components/Header";
import Editor from "../components/Editor";
import Footer from "../components/Footer";
import { useLanguage } from "../context/LanguageContext";

export default function Page() {
  const { lang, setLanguage } = useLanguage();

  return (
    <>
      <select
        value={lang}
        onChange={(e) => setLanguage(e.target.value as "ar" | "en")}
        style={{ margin: "1rem" }}
      >
        <option value="ar">العربية</option>
        <option value="en">English</option>
      </select>
      <Header />
      <Editor />
      <Footer />
    </>
  );
}
