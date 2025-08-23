import { freezeText, FrozenText } from "./utils/freeze";

const LANGUAGE_NAMES: Record<string, string> = {
  ar: "Arabic",
  en: "English",
  tr: "Turkish",
  fr: "French",
  es: "Spanish",
  de: "German",
  ru: "Russian",
  "zh-Hans": "Chinese (Simplified)",
  ja: "Japanese",
};

const PROMPT_TEMPLATES: Record<"wide" | "inquiry", Record<string, string>> = {
  wide: {
    ar: `WIDE/AR: أنت محرّك Qaadi. حرّر نصًا عربيًا واسعًا موجّهًا للورقة (bundle.md). المدخل:\n`,
    en: `WIDE/EN: You are the Qaadi engine. Edit a wide English text intended for the paper (bundle.md). Input:\n`,
    tr: `WIDE/TR: Qaadi motorusun. Makale için geniş Türkçe metni düzenle (bundle.md). Girdi:\n`,
    fr: `WIDE/FR: Tu es le moteur Qaadi. Édite un texte français étendu destiné au papier (bundle.md). Entrée :\n`,
    de: `WIDE/DE: Du bist der Qaadi-Motor. Bearbeite einen ausführlichen deutschen Text für das Papier (bundle.md). Eingabe:\n`,
    es: `WIDE/ES: Eres el motor Qaadi. Edita texto español amplio dirigido al artículo (bundle.md). Entrada:\n`,
    ru: `WIDE/RU: Ты движок Qaadi. Редактируй широкий русский текст для статьи (bundle.md). Ввод:\n`,
    "zh-Hans": `WIDE/ZH-HANS: 你是 Qaadi 引擎。编辑面向论文的中文长文 (bundle.md)。输入:\n`,
    ja: `WIDE/JA: あなたは Qaadi エンジンです。論文用の日本語の長文を編集してください (bundle.md)。入力:\n`,
    other: `WIDE/OTHER: You are the Qaadi engine. Edit a long text in its original language intended for the paper (bundle.md). Input:\n`,
  },
  inquiry: {
    ar: `INQUIRY/AR: أنت محرّك Qaadi. أجب على استفسار عربي موجه للورقة (inquiry.md). المدخل:\n`,
    en: `INQUIRY/EN: You are the Qaadi engine. Answer an English inquiry intended for the paper (inquiry.md). Input:\n`,
    tr: `INQUIRY/TR: Qaadi motorusun. Makale için Türkçe bir soruyu yanıtla (inquiry.md). Girdi:\n`,
    fr: `INQUIRY/FR: Tu es le moteur Qaadi. Réponds à une requête française destinée à l'article (inquiry.md). Entrée :\n`,
    de: `INQUIRY/DE: Du bist der Qaadi-Motor. Beantworte eine deutsche Anfrage für den Artikel (inquiry.md). Eingabe:\n`,
    es: `INQUIRY/ES: Eres el motor Qaadi. Responde una consulta en español destinada al artículo (inquiry.md). Entrada:\n`,
    ru: `INQUIRY/RU: Ты движок Qaadi. Ответь на русский запрос для статьи (inquiry.md). Ввод:\n`,
    "zh-Hans": `INQUIRY/ZH-HANS: 你是 Qaadi 引擎。用中文回答一个面向论文的询问 (inquiry.md)。输入:\n`,
    ja: `INQUIRY/JA: あなたは Qaadi エンジンです。論文用の日本語の問いに答えてください (inquiry.md)。入力:\n`,
  },
};

const TEMPLATE_TARGET_NAMES: Record<string, string> = {
  revtex: "ReVTeX",
  iop: "IOP",
  "sn-jnl": "Springer Nature Journal",
  elsevier: "Elsevier",
  ieee: "IEEE",
  arxiv: "arXiv",
};

const TEMPLATE_TARGETS = new Set(Object.keys(TEMPLATE_TARGET_NAMES));

export function buildTranslationPrompts(
  langs: string[],
  userText: string
): { prompts: Record<string, string>; frozen: FrozenText } {
  const frozen = freezeText(userText);
  const prompts: Record<string, string> = {};
  for (const l of langs) {
    const name = LANGUAGE_NAMES[l] || l;
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
      ? (() => {
          const entries = Object.entries(glossary)
            .map(([k, v]) => `${k} = ${v}`)
            .join("\n");
          return "\nGlossary:\n" + freezeText(entries).text;
        })()
      : "";
  const targetTemplates = PROMPT_TEMPLATES[target as "wide" | "inquiry"];
  if (targetTemplates) {
    const template = targetTemplates[lang];
    if (!template) throw new Error(`unsupported_${target}_lang:${lang}`);
    return { prompt: `${template}${frozen.text}${gloss}`, frozen };
  }
  if (TEMPLATE_TARGETS.has(target)) {
    if (lang === "other") throw new Error(`unsupported_template_lang:${target}:${lang}`);
    const langName = LANGUAGE_NAMES[lang];
    const tName = TEMPLATE_TARGET_NAMES[target];
    if (!langName || !tName)
      throw new Error(`unsupported_target_lang:${target}:${lang}`);
    return {
      prompt: `${target.toUpperCase()}/${lang.toUpperCase()}: Produce LaTeX draft body (no \\documentclass) for ${tName} style in ${langName}. Input:\n${frozen.text}${gloss}`,
      frozen,
    };
  }
  throw new Error(`unsupported_target_lang:${target}:${lang}`);
}
