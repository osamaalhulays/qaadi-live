"use client";

import Header from "../components/Header";
import Editor from "../components/Editor";
import Footer from "../components/Footer";
import { useLanguage } from "../lib/LanguageContext";

export default function Page() {
  const { setLanguage } = useLanguage();
  return (
    <>
      <Header />
      <div>
        <button onClick={() => setLanguage("ar")}>العربية</button>
        <button onClick={() => setLanguage("en")}>English</button>
      </div>
      <Editor />
      <Footer />
    </>
  );
}
