"use client";

import { useEffect, useState } from "react";

export default function LangDirProvider() {
  const [lang, setLang] = useState(
    typeof navigator !== "undefined" ? navigator.language.split("-")[0] : "en"
  );
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");

  useEffect(() => {
    try {
      const l = localStorage.getItem("lang");
      const d = localStorage.getItem("dir") as "ltr" | "rtl" | null;
      if (l) setLang(l);
      if (d) setDir(d);
    } catch {}

    const onStorage = (e: StorageEvent) => {
      if (e.key === "lang" && e.newValue) setLang(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const rtlLangs = new Set(["ar", "he", "fa", "ur"]);
    const newDir: "ltr" | "rtl" = rtlLangs.has(lang) ? "rtl" : "ltr";
    setDir(newDir);
    try {
      localStorage.setItem("lang", lang);
      localStorage.setItem("dir", newDir);
    } catch {}
  }, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  return null;
}
