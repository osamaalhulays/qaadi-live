"use client";

import { useEffect, useState } from "react";

export default function LangDirProvider() {
  const [lang, setLang] = useState(
    typeof navigator !== "undefined" ? navigator.language.split("-")[0] : ""
  );
  const [dir, setDir] = useState<"ltr" | "rtl" | "">(
    typeof navigator !== "undefined"
      ? navigator.language.startsWith("ar")
        ? "rtl"
        : "ltr"
      : ""
  );

  useEffect(() => {
    try {
      const l = localStorage.getItem("lang");
      const d = localStorage.getItem("dir");
      if (l) setLang(l);
      else setLang("en");
      if (d === "rtl" || d === "ltr") setDir(d as "rtl" | "ltr");
      else setDir("ltr");
    } catch {
      setLang("en");
      setDir("ltr");
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  return null;
}
