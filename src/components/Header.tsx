"use client";

import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "./LangDirProvider";

export default function Header() {
  const { t } = useLanguage();
  return (
    <header style={{ display: "flex", alignItems: "center" }}>
      <h1 className="h1" style={{ marginRight: 8 }}>
        <span className="badge">⚖️</span> {t("header.title")}
      </h1>
      <LanguageSelector />
    </header>
  );
}
