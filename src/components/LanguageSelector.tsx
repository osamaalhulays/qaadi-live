"use client";

import { useLanguage } from "./LangDirProvider";

export default function LanguageSelector() {
  const { lang, setLang } = useLanguage();
  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as "en" | "ar")}
      style={{ marginLeft: "auto" }}
    >
      <option value="en">EN</option>
      <option value="ar">AR</option>
    </select>
  );
}
