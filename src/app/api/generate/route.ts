import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

type Provider = 'openai' | 'deepseek';
type Body = {
  preferred?: Provider,
  openaiKey?: string,
  deepseekKey?: string,
  mode?: string,
  model?: string,
  max_tokens?: number,
  sys?: string,
  prompt?: string
};

async function callUpstream(url: string, key: string, model: string, sys: string, prompt: string, max_tokens: number) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role:'system', content: sys||'' }, { role:'user', content: prompt||'' }],
      max_tokens: max_tokens || 800,
      temperature: 0.2
    })
  });
  const text = await r.text();
  let j: any = null; try { j = JSON.parse(text); } catch {}
  if (!r.ok) throw new Error(j?.error?.message || text || `upstream ${r.status}`);
  return j?.choices?.[0]?.message?.content || '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Body;
    const pref = body.preferred || 'openai';
    const sys = body.sys || '';
    const prompt = body.prompt || '';
    const model = body.model || (pref==='openai' ? 'gpt-4o-mini' : 'deepseek-chat');
    const max_tokens = body.max_tokens || 800;

    const order: Provider[] = pref==='openai' ? ['openai','deepseek'] : ['deepseek','openai'];
    let output = '';
    let lastErr: any = null;
    for (const p of order) {
      try {
        if (p==='openai') {
          if (!body.openaiKey) throw new Error('missing OpenAI key');
          output = await callUpstream('https://api.openai.com/v1/chat/completions', body.openaiKey, model, sys, prompt, max_tokens);
        } else {
          if (!body.deepseekKey) throw new Error('missing DeepSeek key');
          const mdl = model==='gpt-4o-mini' ? 'deepseek-chat' : model;
          output = await callUpstream('https://api.deepseek.com/v1/chat/completions', body.deepseekKey, mdl, sys, prompt, max_tokens);
        }
        if (output) break;
      } catch (e) { lastErr = e; }
    }

    if (!output) throw lastErr || new Error('no output');
    const res = NextResponse.json({ output });
    res.headers.set('Cache-Control','no-store');
    res.headers.set('X-Content-Type-Options','nosniff');
    return res;
  } catch (e:any) {
    const res = NextResponse.json({ error:'upstream_error', detail:String(e?.message||e) }, { status: 502 });
    res.headers.set('Cache-Control','no-store');
    res.headers.set('X-Content-Type-Options','nosniff');
    return res;
  }
}
