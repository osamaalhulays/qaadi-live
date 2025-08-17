"use client";

import Link from "next/link";
import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "./LangDirProvider";

export default function Header() {
  const { t } = useLanguage();
  return (
    <header style={{ display: "flex", alignItems: "center" }}>
      <h1 className="h1" style={{ marginRight: 8 }}>
        <span className="badge">⚖️</span> {t("header.title")}
      </h1>
      <nav style={{ display: "flex", gap: 8 }}>
        <Link href="/secretary">Secretary</Link>
        <Link href="/judge">Judge</Link>
        <Link href="/consultant">Consultant</Link>
        <Link href="/department-head">Department Head</Link>
        <Link href="/journalist">Journalist</Link>
      </nav>
      <LanguageSelector />
    </header>
  );
}
