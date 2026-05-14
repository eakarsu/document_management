/**
 * parseAIJson — robust 3-strategy parser for LLM JSON responses.
 *
 * 1. Strip ```json … ``` fences and JSON.parse.
 * 2. Locate the first balanced { … } / [ … ] block via regex and parse.
 * 3. Aggressive cleanup (smart quotes, trailing commas, control chars), retry.
 *
 * Returns { ok, data } or { ok: false, raw, error }.
 */

export interface ParseResult<T = unknown> {
  ok: boolean;
  data: T | null;
  raw?: string;
  error?: string;
  strategy?: 'fence' | 'extract' | 'cleanup';
}

export function parseAIJson<T = unknown>(
  raw: string | null | undefined,
  opts: { fallback?: T | null } = {},
): ParseResult<T> {
  const fallback = opts.fallback ?? null;
  if (raw == null) return { ok: false, data: fallback, raw: '', error: 'empty input' };
  const text = String(raw).trim();
  if (!text) return { ok: false, data: fallback, raw: '', error: 'empty input' };

  // Strategy 1: strip fenced code block.
  const fenced = text
    .replace(/^```(?:json|JSON)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return { ok: true, data: JSON.parse(fenced) as T, strategy: 'fence' };
  } catch {
    /* fall through */
  }

  // Strategy 2: extract first balanced object or array.
  const objMatch = fenced.match(/\{[\s\S]*\}/);
  const arrMatch = fenced.match(/\[[\s\S]*\]/);
  let candidate: string | null = null;
  if (objMatch && arrMatch) {
    candidate = (objMatch.index ?? 0) < (arrMatch.index ?? 0) ? objMatch[0] : arrMatch[0];
  } else {
    candidate = objMatch?.[0] ?? arrMatch?.[0] ?? null;
  }
  if (candidate) {
    try {
      return { ok: true, data: JSON.parse(candidate) as T, strategy: 'extract' };
    } catch {
      /* fall through */
    }
  }

  // Strategy 3: aggressive cleanup.
  const cleaned = (candidate || fenced)
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,(\s*[}\]])/g, '$1')
    .replace(/[\u0000-\u001F]+/g, ' ');
  try {
    return { ok: true, data: JSON.parse(cleaned) as T, strategy: 'cleanup' };
  } catch (err) {
    return {
      ok: false,
      data: fallback,
      raw: text.slice(0, 1000),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export default parseAIJson;
