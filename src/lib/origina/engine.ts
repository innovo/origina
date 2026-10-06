import { CORPUS, type CorpusDoc } from "./corpus";
import {
  DISCLAIMER,
  type CitationFinding,
  type Findings,
  type MatchKind,
  type ObfuscationFlag,
  type ObfuscationResult,
  type SourceHit,
  type SourceType,
  type TextSpan,
} from "./types";
import { inspectInvisible } from "./zero-width";
import { foldHomoglyphs } from "./homoglyphs";
import { inspectTextUrls } from "./idn";

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

const STOP = new Set(
  `a an the of and to in for on with at from by as is are was were be been being it this that those these or nor not if then so than too very can will just into over after before about between through during without within also such same other more most some any each few many much own under until while above below again further once here there when where why how all both`.split(
    " ",
  ),
);

function stem(word: string) {
  let w = word.toLowerCase();
  if (w.length <= 4) return w;
  w = w.replace(/'(s|d|ve|ll|re)$/g, "");
  w = w.replace(/(ing|edly|edly|edly)$/g, "");
  w = w.replace(/(tion|sion|ment|ness|able|ible|ous|ive|less)$/g, "");
  w = w.replace(/(ers|ies|ied|ing|est|ly|ed|es|s)$/g, "");
  return w;
}

function countMatches(text: string, re: RegExp) {
  const copy = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  const found = text.match(copy);
  return found?.length ?? 0;
}

function samples(text: string, re: RegExp, n = 4) {
  const copy = new RegExp(re.source, "g");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = copy.exec(text)) && out.length < n) {
    const code = m[0]
      .split("")
      .map((ch) => "U+" + ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0"))
      .join(" ");
    if (!out.includes(code)) out.push(code);
  }
  return out;
}

function replaceHomoglyphs(text: string) {
  return foldHomoglyphs(text);
}

export function scanObfuscation(text: string): ObfuscationResult {
  const flags: ObfuscationFlag[] = [];
  const inspected = inspectInvisible(text);
  const zwHits = inspected.hits.filter((h) => h.category !== "bidi");
  const bidiHits = inspected.hits.filter((h) => h.category === "bidi");
  if (zwHits.length) {
    flags.push({
      kind: "zero-width",
      label: "Zero-width and non-printing characters",
      count: zwHits.length,
      samples: [...new Set(zwHits.map((h) => h.hex))].slice(0, 8),
    });
  }
  if (bidiHits.length) {
    flags.push({
      kind: "bidi",
      label: "Bidirectional override / embedding marks",
      count: bidiHits.length,
      samples: [...new Set(bidiHits.map((h) => h.hex))].slice(0, 6),
    });
  }
  const ctrl = countMatches(text, CONTROL);
  if (ctrl) {
    flags.push({
      kind: "control",
      label: "Abnormal control characters",
      count: ctrl,
      samples: samples(text, CONTROL),
    });
  }
  const homo = replaceHomoglyphs(text);
  if (homo.count) {
    flags.push({
      kind: "homoglyph",
      label: "Homoglyph and character substitution",
      count: homo.count,
      samples: homo.samples,
    });
  }
  const hiddenPattern = /font-size\s*:\s*0|display\s*:\s*none|color\s*:\s*#fff|mso-/i;
  if (hiddenPattern.test(text)) {
    flags.push({
      kind: "hidden",
      label: "Hidden text or font-manipulation hints",
      count: 1,
      samples: ["CSS / markup suggesting hidden or white-on-white text"],
    });
  }
  if (/<\?php|javascript:|onerror=|<script/i.test(text)) {
    flags.push({
      kind: "metadata",
      label: "Embedded script or unexpected markup",
      count: 1,
      samples: ["Markup / script tokens inside the submission"],
    });
  }
  const idn = inspectTextUrls(text);
  const idnHits = idn.findings.filter((f) => f.severity !== "ok");
  if (idnHits.length) {
    flags.push({
      kind: "idn",
      label: "Lookalike or encoded domain (IDN homograph)",
      count: idnHits.length,
      samples: idnHits
        .slice(0, 4)
        .map((f) => (f.spoofOf ? `${f.unicodeHost} ≈ ${f.spoofOf}` : f.unicodeHost)),
    });
  }

  let cleaned = inspected.cleaned.replace(CONTROL, "");
  cleaned = replaceHomoglyphs(cleaned).text;
  const strippedCount = Math.max(0, text.length - cleaned.length) + homo.count;
  const score = Math.min(
    100,
    flags.reduce((s, f) => s + Math.min(40, f.count * 8), 0),
  );

  return {
    score,
    flags,
    cleanedText: cleaned,
    originalLength: text.length,
    strippedCount,
  };
}

type Word = { text: string; start: number; end: number; stem: string; stop: boolean };

function wordsOf(text: string): Word[] {
  const out: Word[] = [];
  const re = /[A-Za-zÀ-öø-ÿ0-9']+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const raw = m[0];
    const lower = raw.toLowerCase();
    out.push({
      text: raw,
      start: m.index,
      end: m.index + raw.length,
      stem: stem(lower),
      stop: STOP.has(lower),
    });
  }
  return out;
}

function shingleKeys(words: Word[], n: number, mode: "raw" | "stem") {
  const keys: { key: string; from: number; to: number }[] = [];
  if (words.length < n) return keys;
  for (let i = 0; i <= words.length - n; i++) {
    const slice = words.slice(i, i + n);
    const key =
      mode === "raw"
        ? slice.map((w) => w.text.toLowerCase()).join(" ")
        : slice.map((w) => w.stem).join(" ");
    keys.push({ key, from: i, to: i + n });
  }
  return keys;
}

type IndexedDoc = {
  doc: CorpusDoc;
  raw5: Set<string>;
  raw8: Set<string>;
  stem3: Set<string>;
  words: Word[];
};

function indexDoc(doc: CorpusDoc): IndexedDoc {
  const words = wordsOf(doc.body);
  return {
    doc,
    words,
    raw5: new Set(shingleKeys(words, 5, "raw").map((s) => s.key)),
    raw8: new Set(shingleKeys(words, 8, "raw").map((s) => s.key)),
    stem3: new Set(
      shingleKeys(
        words.filter((w) => !w.stop),
        3,
        "stem",
      ).map((s) => s.key),
    ),
  };
}

let cachedIndex: IndexedDoc[] | null = null;

export function corpusIndex(extra: CorpusDoc[] = []): IndexedDoc[] {
  const base = cachedIndex ?? (cachedIndex = CORPUS.map(indexDoc));
  if (extra.length === 0) return base;
  return base.concat(extra.map(indexDoc));
}

const AF_HINTS = ["die", "en", "is", "van", "nie", "vir", "op", "met", "een", "wat", "het", "n"];
const XH_HINTS = ["ukuba", "kwaye", "nathi", "umntu", "abantu", "kunye", "nje", "kufuneka"];
const EN_HINTS = ["the", "and", "of", "to", "in", "for", "is", "that", "with", "as", "this"];

export function detectLanguage(text: string): Findings["language"] {
  const tokens = text.toLowerCase().match(/[a-zà-öø-ÿ']+/g) ?? [];
  const n = Math.max(tokens.length, 1);
  const score = (hints: string[]) =>
    hints.reduce((s, h) => s + tokens.filter((t) => t === h).length, 0) / n;
  const en = score(EN_HINTS);
  const af = score(AF_HINTS);
  const xh = score(XH_HINTS);
  if (af > en && af > xh && af > 0.02)
    return { code: "af", name: "Afrikaans", confidence: Math.min(0.95, 0.4 + af * 8) };
  if (xh > en && xh > 0.008)
    return { code: "xh", name: "isiXhosa", confidence: Math.min(0.9, 0.35 + xh * 12) };
  return { code: "en", name: "English", confidence: Math.min(0.96, 0.5 + en * 6) };
}

export function extractCitations(text: string): CitationFinding[] {
  const found = new Set<string>();
  const out: CitationFinding[] = [];
  const patterns = [
    /\(([^()]{3,80}?,\s*\d{4}[a-z]?)\)/g,
    /([A-Z][A-Za-z-]+(?:\s+(?:et al\.|and|&)\s+[A-Z][A-Za-z-]+)?\s+\(\d{4}\))/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    const copy = new RegExp(re.source, "g");
    while ((m = copy.exec(text))) {
      const t = m[0].replace(/\s+/g, " ").trim();
      if (found.has(t) || t.length < 6) continue;
      found.add(t);
      const year = t.match(/\d{4}/);
      const y = year ? Number(year[0]) : 0;
      let issue: string | null = null;
      if (y > new Date().getFullYear() + 1) issue = "Citation year is in the future.";
      if (/lorem|placeholder|xxx/i.test(t)) issue = "Placeholder citation.";
      out.push({ text: t, issue, ok: !issue });
    }
  }
  for (const f of inspectTextUrls(text).findings) {
    if (f.severity === "ok" || found.has(f.raw)) continue;
    found.add(f.raw);
    out.push({
      text: f.raw,
      ok: false,
      issue: f.spoofOf
        ? `IDN homograph of ${f.spoofOf}: ${f.reasons[0]}`
        : `Suspicious host: ${f.reasons[0]}`,
    });
  }
  return out.slice(0, 24);
}

function overlapPct(covered: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((1000 * covered) / total) / 10;
}

export type PreviousSubmission = {
  id: string;
  title: string;
  body: string;
};

export function analyseLocal(input: {
  text: string;
  previous?: PreviousSubmission[];
  extraCorpus?: CorpusDoc[];
}): Findings {
  const obfuscation = scanObfuscation(input.text);
  const cleaned = obfuscation.cleanedText;
  const words = wordsOf(cleaned);
  const contentWords = words.filter((w) => !w.stop);
  const language = detectLanguage(cleaned);

  const index = corpusIndex(
    (input.extraCorpus ?? []).concat(
      (input.previous ?? []).map((p) => ({
        id: `self-${p.id}`,
        title: p.title,
        sourceType: "self" as const,
        sourceRef: "Previous submission",
        body: p.body,
      })),
    ),
  );

  const covered = new Map<number, { kind: MatchKind; sourceId: string }>();
  const sourceScores = new Map<
    string,
    { direct: number; partial: number; semantic: number; self: number; doc: IndexedDoc }
  >();

  function bump(doc: IndexedDoc, kind: MatchKind, n: number) {
    const cur = sourceScores.get(doc.doc.id) ?? {
      direct: 0,
      partial: 0,
      semantic: 0,
      self: 0,
      doc,
    };
    cur[kind] += n;
    sourceScores.set(doc.doc.id, cur);
  }

  function mark(from: number, to: number, kind: MatchKind, sourceId: string) {
    for (let i = from; i < to; i++) {
      const existing = covered.get(i);
      const rank: Record<MatchKind, number> = {
        direct: 4,
        self: 3,
        partial: 2,
        semantic: 1,
      };
      if (!existing || rank[kind] >= rank[existing.kind]) {
        covered.set(i, { kind, sourceId });
      }
    }
  }

  const raw8 = shingleKeys(words, 8, "raw");
  const raw5 = shingleKeys(words, 5, "raw");
  const stem3 = shingleKeys(contentWords, 3, "stem");

  for (const s of raw8) {
    for (const doc of index) {
      if (doc.raw8.has(s.key)) {
        const kind: MatchKind = doc.doc.sourceType === "self" ? "self" : "direct";
        mark(s.from, s.to, kind, doc.doc.id);
        bump(doc, kind, 8);
      }
    }
  }
  for (const s of raw5) {
    for (const doc of index) {
      if (doc.raw5.has(s.key)) {
        const kind: MatchKind = doc.doc.sourceType === "self" ? "self" : "partial";
        mark(s.from, s.to, kind, doc.doc.id);
        bump(doc, kind, 5);
      }
    }
  }
  for (const s of stem3) {
    for (const doc of index) {
      if (doc.stem3.has(s.key)) {
        const kind: MatchKind = doc.doc.sourceType === "self" ? "self" : "semantic";
        const from = contentWords[s.from] ? words.indexOf(contentWords[s.from]) : -1;
        const toWord = contentWords[s.to - 1];
        const to = toWord ? words.indexOf(toWord) + 1 : from;
        if (from >= 0 && to > from) mark(from, to, kind, doc.doc.id);
        bump(doc, kind, 3);
      }
    }
  }

  const spans: TextSpan[] = [];
  const sortedIdx = [...covered.keys()].sort((a, b) => a - b);
  let i = 0;
  while (i < sortedIdx.length) {
    const startIdx = sortedIdx[i];
    const meta = covered.get(startIdx)!;
    let endIdx = startIdx;
    let j = i + 1;
    while (
      j < sortedIdx.length &&
      sortedIdx[j] === endIdx + 1 &&
      covered.get(sortedIdx[j])?.sourceId === meta.sourceId &&
      covered.get(sortedIdx[j])?.kind === meta.kind
    ) {
      endIdx = sortedIdx[j];
      j += 1;
    }
    spans.push({
      start: words[startIdx].start,
      end: words[endIdx].end,
      kind: meta.kind,
      sourceId: meta.sourceId,
    });
    i = j;
  }

  const methodCovered = {
    direct: 0,
    partial: 0,
    semantic: 0,
    self: 0,
  };
  for (const meta of covered.values()) methodCovered[meta.kind] += 1;

  const sources: SourceHit[] = [...sourceScores.values()]
    .map((s) => {
      const matched = s.direct + s.partial + s.semantic + s.self;
      const kind: MatchKind =
        s.doc.doc.sourceType === "self"
          ? "self"
          : s.direct >= s.partial && s.direct >= s.semantic
            ? "direct"
            : s.partial >= s.semantic
              ? "partial"
              : "semantic";
      const excerpt = s.doc.doc.body.slice(0, 180).replace(/\s+/g, " ") + "…";
      const sourceType: SourceType = s.doc.doc.sourceType;
      return {
        id: s.doc.doc.id,
        title: s.doc.doc.title,
        sourceType,
        sourceRef: s.doc.doc.sourceRef,
        overlapPct: overlapPct(matched, Math.max(words.length, 1) * 2),
        matchedWords: matched,
        kind,
        excerpt,
      };
    })
    .sort((a, b) => b.overlapPct - a.overlapPct)
    .slice(0, 8);

  const spanCover = new Map<string, number>();
  for (const [idx, meta] of covered) {
    void idx;
    spanCover.set(meta.sourceId, (spanCover.get(meta.sourceId) ?? 0) + 1);
  }
  for (const s of sources) {
    s.overlapPct = overlapPct(spanCover.get(s.id) ?? 0, words.length);
    s.matchedWords = spanCover.get(s.id) ?? 0;
  }

  // Drop sources whose words were all attributed to a closer match.
  for (let i = sources.length - 1; i >= 0; i--) if (sources[i].matchedWords === 0) sources.splice(i, 1);
  sources.sort((a, b) => b.overlapPct - a.overlapPct);

  const similarity = Math.min(100, Math.round(overlapPct(covered.size, words.length)));
  const citations = extractCitations(input.text);

  return {
    similarity,
    methods: {
      direct: overlapPct(methodCovered.direct, words.length),
      partial: overlapPct(methodCovered.partial, words.length),
      semantic: overlapPct(methodCovered.semantic, words.length),
      self: overlapPct(methodCovered.self, words.length),
    },
    language,
    obfuscation,
    spans,
    sources,
    citations,
    wordCount: words.length,
    ai: {
      likelihood: null,
      confidence: null,
      summary: null,
      indicators: [],
      passages: [],
      translationSuspicion: false,
      paraphraseSuspicion: similarity > 20 && methodCovered.semantic > methodCovered.direct,
      unavailable: true,
    },
    disclaimer: DISCLAIMER,
  };
}
