import crypto from "crypto";

export type Lang =
  | "ar"
  | "en"
  | "tr"
  | "fr"
  | "es"
  | "de"
  | "ru"
  | "zh-Hans"
  | "ja"
  | "other";

export interface InquiryQuestion {
  question: string;
  covers: string[];
}

function sha256Hex(data: string): string {
  return crypto.createHash("sha256").update(Buffer.from(data)).digest("hex");
}

const PROMPTS: Record<Lang, string> = {
  ar: "يرجى توضيح",
  en: "Please clarify",
  tr: "Lütfen açıklayın",
  fr: "Veuillez clarifier",
  es: "Por favor aclare",
  de: "Bitte erläutern",
  ru: "Пожалуйста, уточните",
  "zh-Hans": "请说明",
  ja: "説明してください",
  other: "Please clarify"
};

/**
 * Generate an inquiry (list of questions) based on a plan in Markdown.
 * Each question includes a `covers` field with the sha256 of the plan line it covers.
 */
export function generateInquiryFromPlan(planText: string, lang: Lang): {
  markdown: string;
  questions: InquiryQuestion[];
} {
  const lines = planText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && (/^[-*]/.test(l) || /^\d+\./.test(l)));

  const prefix = PROMPTS[lang] || PROMPTS.en;

  const questions: InquiryQuestion[] = lines.map((line) => {
    const item = line.replace(/^[-*]\s*/, "").replace(/^\d+\.\s*/, "");
    const hash = sha256Hex(item);
    return {
      question: `${prefix}: ${item}?`,
      covers: [hash]
    };
  });

  const markdown = questions
    .map((q, i) => `${i + 1}. ${q.question}`)
    .join("\n");

  return { markdown, questions };
}
