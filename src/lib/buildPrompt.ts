import { freezeText, FrozenText } from "./utils/freeze";

export function buildTranslationPrompts(
  langs: string[],
  userText: string
): { prompts: Record<string, string>; frozen: FrozenText } {
  const frozen = freezeText(userText);
  const langNames: Record<string, string> = {
    ar: "Arabic",
    en: "English",
    tr: "Turkish",
    fr: "French",
    es: "Spanish",
    de: "German",
    ru: "Russian",
    "zh-Hans": "Chinese (Simplified)",
    ja: "Japanese"
  };
  const prompts: Record<string, string> = {};
  for (const l of langs) {
    const name = langNames[l] || l;
    prompts[l] = `TRANSLATE/${l.toUpperCase()}: Translate the following text to ${name}. Input:\n${frozen.text}`;
  }
  return { prompts, frozen };
}

export function buildPrompt(
  target:
    | "wide"
    | "revtex"
    | "inquiry"
    | "iop"
    | "sn-jnl"
    | "elsevier"
    | "ieee"
    | "arxiv",
  lang:
    | "ar"
    | "en"
    | "tr"
    | "fr"
    | "es"
    | "de"
    | "ru"
    | "zh-Hans"
    | "ja"
    | "other",
  userText: string,
  glossary: Record<string, string> | null
): { prompt: string; frozen: FrozenText } {
  const frozen = freezeText(userText);
  const gloss =
    glossary && Object.keys(glossary).length
      ? "\nGlossary:\n" +
        Object.entries(glossary)
          .map(([k, v]) => `${k} = ${v}`)
          .join("\n")
      : "";

  if (target === "wide") {
    if (lang === "ar")
      return { prompt: `WIDE/AR: أنت محرّك Qaadi. حرّر نصًا عربيًا واسعًا موجّهًا للورقة (bundle.md). المدخل:\n${frozen.text}${gloss}`, frozen };
    if (lang === "en")
      return { prompt: `WIDE/EN: You are the Qaadi engine. Edit a wide English text intended for the paper (bundle.md). Input:\n${frozen.text}${gloss}`, frozen };
    if (lang === "tr")
      return { prompt: `WIDE/TR: Qaadi motorusun. Makale için geniş Türkçe metni düzenle (bundle.md). Girdi:\n${frozen.text}${gloss}`, frozen };
    if (lang === "fr")
      return { prompt: `WIDE/FR: Tu es le moteur Qaadi. Édite un texte français étendu destiné au papier (bundle.md). Entrée :\n${frozen.text}${gloss}`, frozen };
    if (lang === "de")
      return { prompt: `WIDE/DE: Du bist der Qaadi-Motor. Bearbeite einen ausführlichen deutschen Text für das Papier (bundle.md). Eingabe:\n${frozen.text}${gloss}`, frozen };
    if (lang === "es")
      return { prompt: `WIDE/ES: Eres el motor Qaadi. Edita texto español amplio dirigido al artículo (bundle.md). Entrada:\n${frozen.text}${gloss}`, frozen };
    if (lang === "ru")
      return { prompt: `WIDE/RU: Ты движок Qaadi. Редактируй широкий русский текст для статьи (bundle.md). Ввод:\n${frozen.text}${gloss}`, frozen };
    if (lang === "zh-Hans")
      return { prompt: `WIDE/ZH-HANS: 你是 Qaadi 引擎。编辑面向论文的中文长文 (bundle.md)。输入:\n${frozen.text}${gloss}`, frozen };
    if (lang === "ja")
      return { prompt: `WIDE/JA: あなたは Qaadi エンジンです。論文用の日本語の長文を編集してください (bundle.md)。入力:\n${frozen.text}${gloss}`, frozen };
    if (lang === "other")
      return { prompt: `WIDE/OTHER: You are the Qaadi engine. Edit a long text in its original language intended for the paper (bundle.md). Input:\n${frozen.text}${gloss}`, frozen };
  }
  if (target === "inquiry") {
    if (lang === "ar")
      return { prompt: `INQUIRY/AR: أنت محرّك Qaadi. أجب على استفسار عربي موجه للورقة (inquiry.md). المدخل:\n${frozen.text}${gloss}`, frozen };
    if (lang === "en")
      return { prompt: `INQUIRY/EN: You are the Qaadi engine. Answer an English inquiry intended for the paper (inquiry.md). Input:\n${frozen.text}${gloss}`, frozen };
    if (lang === "tr")
      return { prompt: `INQUIRY/TR: Qaadi motorusun. Makale için Türkçe bir soruyu yanıtla (inquiry.md). Girdi:\n${frozen.text}${gloss}`, frozen };
    if (lang === "fr")
      return { prompt: `INQUIRY/FR: Tu es le moteur Qaadi. Réponds à une requête française destinée à l'article (inquiry.md). Entrée :\n${frozen.text}${gloss}`, frozen };
    if (lang === "de")
      return { prompt: `INQUIRY/DE: Du bist der Qaadi-Motor. Beantworte eine deutsche Anfrage für den Artikel (inquiry.md). Eingabe:\n${frozen.text}${gloss}`, frozen };
    if (lang === "es")
      return { prompt: `INQUIRY/ES: Eres el motor Qaadi. Responde una consulta en español destinada al artículo (inquiry.md). Entrada:\n${frozen.text}${gloss}`, frozen };
    if (lang === "ru")
      return { prompt: `INQUIRY/RU: Ты движок Qaadi. Ответь на русский запрос для статьи (inquiry.md). Ввод:\n${frozen.text}${gloss}`, frozen };
    if (lang === "zh-Hans")
      return { prompt: `INQUIRY/ZH-HANS: 你是 Qaadi 引擎。用中文回答一个面向论文的询问 (inquiry.md)。输入:\n${frozen.text}${gloss}`, frozen };
    if (lang === "ja")
      return { prompt: `INQUIRY/JA: あなたは Qaadi エンジンです。論文用の日本語の問いに答えてください (inquiry.md)。入力:\n${frozen.text}${gloss}`, frozen };
    throw new Error("unsupported_inquiry_lang");
  }
  const templateTargets = new Set(["revtex", "iop", "sn-jnl", "elsevier", "ieee", "arxiv"]);
  if (templateTargets.has(target)) {
    if (lang === "other") throw new Error(`unsupported_template_lang:${target}:${lang}`);
    const langNames: Record<string, string> = {
      ar: "Arabic",
      en: "English",
      tr: "Turkish",
      fr: "French",
      es: "Spanish",
      de: "German",
      ru: "Russian",
      "zh-Hans": "Chinese (Simplified)",
      ja: "Japanese"
    };
    const targetNames: Record<string, string> = {
      revtex: "ReVTeX",
      iop: "IOP",
      "sn-jnl": "Springer Nature Journal",
      elsevier: "Elsevier",
      ieee: "IEEE",
      arxiv: "arXiv"
    };
    const langName = langNames[lang];
    const tName = targetNames[target];
    if (!langName || !tName)
      throw new Error(`unsupported_target_lang:${target}:${lang}`);
    return {
      prompt: `${target.toUpperCase()}/${lang.toUpperCase()}: Produce LaTeX draft body (no \\documentclass) for ${tName} style in ${langName}. Input:\n${frozen.text}${gloss}`,
      frozen
    };
  }
  throw new Error(`unsupported_target_lang:${target}:${lang}`);
}
