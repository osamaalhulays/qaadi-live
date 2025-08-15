export interface FrozenText {
  text: string;
  equations: string[];
  dois: string[];
  codes: string[];
}

// Freeze LaTeX equations, code blocks and DOIs to placeholders
export function freezeText(input: string): FrozenText {
  const equations: string[] = [];
  const dois: string[] = [];
  const codes: string[] = [];
  let text = input;

  // Code blocks: ```...``` or inline `...`
  const codeRegex = /```[\s\S]*?```|`[^`\n]+`/g;
  text = text.replace(codeRegex, (m) => {
    const id = codes.length;
    codes.push(m);
    return `⟦CODE${id}⟧`;
  });

  // LaTeX equations: $$...$$, $...$, \[...\], \(...\)
  const eqRegex = /\$\$[\s\S]*?\$\$|\$[^$]+\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)/g;
  text = text.replace(eqRegex, (m) => {
    const id = equations.length;
    equations.push(m);
    return `⟦EQ${id}⟧`;
  });

  // DOI pattern starting with 10.
  const doiRegex = /10\.\d{4,9}\/[\w.;()/:+-]+/gi;
  text = text.replace(doiRegex, (m) => {
    const id = dois.length;
    dois.push(m);
    return `⟦DOI${id}⟧`;
  });

  return { text, equations, dois, codes };
}

export function restoreText(
  text: string,
  equations: string[],
  dois: string[],
  codes: string[]
): string {
  let out = text;
  equations.forEach((eq, i) => {
    out = out.replace(`⟦EQ${i}⟧`, eq);
  });
  dois.forEach((doi, i) => {
    out = out.replace(`⟦DOI${i}⟧`, doi);
  });
  codes.forEach((code, i) => {
    out = out.replace(`⟦CODE${i}⟧`, code);
  });
  return out;
}

export function countEquations(text: string): number {
  const matches = text.match(/\$\$[\s\S]*?\$\$|\$[^$]+\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)/g);
  return matches ? matches.length : 0;
}
