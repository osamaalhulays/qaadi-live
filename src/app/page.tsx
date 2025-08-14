'use client';

import Header from "../components/Header";
import Editor from "../components/Editor";
import Footer from "../components/Footer";
import { useLanguage } from "../components/LanguageProvider";

export default function Page() {
  const { lang, setLang } = useLanguage();
  const toggleLanguage = () => setLang(lang === 'ar' ? 'en' : 'ar');

  return (
    <>
      <Header />
      <button onClick={toggleLanguage}>
        {lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      </button>
      <Editor />
      <Footer />
    </>
  );
}

