import { freezeText, FrozenText } from "./utils/freeze";

const LANGUAGE_NAMES: Record<string, string> = {
  ar: "Arabic",
  en: "English",
};

const PROMPT_TEMPLATES: Record<"wide" | "inquiry", Record<string, string>> = {
  wide: {
    ar: `WIDE/AR: أنت محرّك Qaadi. حرّر نصًا عربيًا واسعًا موجّهًا للورقة (bundle.md). المدخل:\n`,
    en: `WIDE/EN: You are the Qaadi engine. Edit a wide English text intended for the paper (bundle.md). Input:\n`,
  },
  inquiry: {
    ar: `INQUIRY/AR: أنت محرّك Qaadi. أجب على استفسار عربي موجه للورقة (inquiry.md). المدخل:\n`,
    en: `INQUIRY/EN: You are the Qaadi engine. Answer an English inquiry intended for the paper (inquiry.md). Input:\n`,
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
  lang: "ar" | "en",
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
