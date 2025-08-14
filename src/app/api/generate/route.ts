import { NextRequest } from "next/server";
import { InputSchema, OutputSchema } from "../../../lib/schema/io";
import { runWithFallback } from "../../../lib/providers/router";

export const runtime = "edge";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-OpenAI-Key, X-DeepSeek-Key"
    }
  });
}

export async function POST(req: NextRequest) {
  let input;
  try { input = InputSchema.parse(await req.json()); }
  catch { return new Response(JSON.stringify({ error: "bad_input" }), { status: 400 }); }

  const openaiKey = req.headers.get("x-openai-key") ?? "";
  const deepseekKey = req.headers.get("x-deepseek-key") ?? "";
  if (!openaiKey && !deepseekKey) {
    return new Response(JSON.stringify({ error: "no_keys_provided" }), { status: 400 });
  }

  const prompt = buildPrompt(input.template, input.text);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const out = await runWithFallback(
          input.model === "auto" ? "auto" : (input.model as any),
          { openai: openaiKey || undefined, deepseek: deepseekKey || undefined },
          prompt,
          input.max_tokens
        );
        const final = OutputSchema.parse(out);
        const text = final.text;
        const meta = { ...final, text: undefined, total: text.length };
        controller.enqueue(encoder.encode(JSON.stringify({ type: "meta", ...meta }) + "\n"));
        let sent = 0;
        const size = 64;
        while (sent < text.length) {
          const chunk = text.slice(sent, sent + size);
          sent += chunk.length;
          controller.enqueue(encoder.encode(JSON.stringify({ type: "chunk", data: chunk, sent }) + "\n"));
        }
        controller.enqueue(encoder.encode(JSON.stringify({ type: "done" }) + "\n"));
        controller.close();
      } catch (e:any) {
        controller.enqueue(encoder.encode(JSON.stringify({ type: "error", error: e?.message || String(e) }) + "\n"));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

function buildPrompt(template: "WideAR" | "ReVTeX" | "InquiryTR", userText: string) {
  if (template === "WideAR")   return `WIDE/AR: أنت محرّك Qaadi. حرّر نصًا عربيًا واسعًا موجّهًا للورقة (bundle.md). المدخل:\n${userText}`;
  if (template === "InquiryTR") return `INQUIRY/TR: Qaadi Inquiry için soru seti üret. Girdi:\n${userText}`;
  return `REVTEX/EN: Produce TeX draft body (no \\documentclass). Input:\n${userText}`;
}
