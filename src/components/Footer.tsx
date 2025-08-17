"use client";

import { useLanguage } from "./LangDirProvider";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="footer" style={{ marginTop: 24, textAlign: "center" }}>
      <small>© {new Date().getFullYear()} Qaadi</small>
      <span style={{ margin: "0 8px" }}>|</span>
      <a href="/templates">{t("footer.templates")}</a>
      <span style={{ margin: "0 8px" }}>|</span>
      <a href="mailto:contact@qaadi.live">{t("footer.contact")}</a>
    </footer>
  );
}
