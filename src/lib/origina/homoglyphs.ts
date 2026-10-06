import { tr39Target } from "./tr39";

export type GlyphScript = "cyrillic" | "greek" | "fullwidth" | "compat" | "digit";

export type HomoglyphMeta = {
  from: string;
  to: string;
  code: number;
  name: string;
  script: GlyphScript;
  why: string;
};

export type HomoglyphHit = {
  index: number;
  from: string;
  to: string;
  hex: string;
  name: string;
  script: GlyphScript;
  why: string;
  method: "skeleton" | "nfkc" | "digit-context" | "tr39";
  before: string;
  after: string;
};

export type MixedScriptWord = {
  word: string;
  start: number;
  scripts: GlyphScript[] | string[];
};

function hexOf(code: number) {
  return "U+" + code.toString(16).toUpperCase().padStart(4, "0");
}

function entry(
  from: string,
  to: string,
  name: string,
  script: GlyphScript,
  why: string,
): HomoglyphMeta {
  return { from, to, code: from.charCodeAt(0), name, script, why };
}

const CYR_WHY =
  "Cyrillic that renders as a Latin letter. The usual homoglyph dodge in an English or Afrikaans script.";
const GR_WHY =
  "Greek lookalike. Same glyph on the page, different code point, so a naive matcher misses the word.";

const MANUAL: HomoglyphMeta[] = [
  entry("а", "a", "Cyrillic small a", "cyrillic", CYR_WHY),
  entry("е", "e", "Cyrillic small ie", "cyrillic", CYR_WHY),
  entry("о", "o", "Cyrillic small o", "cyrillic", CYR_WHY),
  entry("р", "p", "Cyrillic small er", "cyrillic", CYR_WHY),
  entry("с", "c", "Cyrillic small es", "cyrillic", CYR_WHY),
  entry("у", "y", "Cyrillic small u", "cyrillic", CYR_WHY),
  entry("х", "x", "Cyrillic small ha", "cyrillic", CYR_WHY),
  entry("і", "i", "Cyrillic small byelorussian-ukrainian i", "cyrillic", CYR_WHY),
  entry("ѕ", "s", "Cyrillic small dze", "cyrillic", CYR_WHY),
  entry("ԁ", "d", "Cyrillic small komi de", "cyrillic", CYR_WHY),
  entry("ԛ", "q", "Cyrillic small qa", "cyrillic", CYR_WHY),
  entry("ԝ", "w", "Cyrillic small we", "cyrillic", CYR_WHY),
  entry("һ", "h", "Cyrillic small shha", "cyrillic", CYR_WHY),
  entry("ј", "j", "Cyrillic small je", "cyrillic", CYR_WHY),
  entry("ѵ", "v", "Cyrillic small izhitsa", "cyrillic", CYR_WHY),
  entry("ӏ", "l", "Cyrillic palochka", "cyrillic", CYR_WHY),
  entry("А", "A", "Cyrillic capital a", "cyrillic", CYR_WHY),
  entry("В", "B", "Cyrillic capital ve", "cyrillic", CYR_WHY),
  entry("Е", "E", "Cyrillic capital ie", "cyrillic", CYR_WHY),
  entry("К", "K", "Cyrillic capital ka", "cyrillic", CYR_WHY),
  entry("М", "M", "Cyrillic capital em", "cyrillic", CYR_WHY),
  entry("Н", "H", "Cyrillic capital en", "cyrillic", CYR_WHY),
  entry("О", "O", "Cyrillic capital o", "cyrillic", CYR_WHY),
  entry("Р", "P", "Cyrillic capital er", "cyrillic", CYR_WHY),
  entry("С", "C", "Cyrillic capital es", "cyrillic", CYR_WHY),
  entry("Т", "T", "Cyrillic capital te", "cyrillic", CYR_WHY),
  entry("Х", "X", "Cyrillic capital ha", "cyrillic", CYR_WHY),
  entry("І", "I", "Cyrillic capital ukrainian i", "cyrillic", CYR_WHY),
  entry("Ѕ", "S", "Cyrillic capital dze", "cyrillic", CYR_WHY),
  entry("Ү", "Y", "Cyrillic capital straight u", "cyrillic", CYR_WHY),
  entry("Α", "A", "Greek capital alpha", "greek", GR_WHY),
  entry("Β", "B", "Greek capital beta", "greek", GR_WHY),
  entry("Ε", "E", "Greek capital epsilon", "greek", GR_WHY),
  entry("Ζ", "Z", "Greek capital zeta", "greek", GR_WHY),
  entry("Η", "H", "Greek capital eta", "greek", GR_WHY),
  entry("Ι", "I", "Greek capital iota", "greek", GR_WHY),
  entry("Κ", "K", "Greek capital kappa", "greek", GR_WHY),
  entry("Μ", "M", "Greek capital mu", "greek", GR_WHY),
  entry("Ν", "N", "Greek capital nu", "greek", GR_WHY),
  entry("Ο", "O", "Greek capital omicron", "greek", GR_WHY),
  entry("Ρ", "P", "Greek capital rho", "greek", GR_WHY),
  entry("Τ", "T", "Greek capital tau", "greek", GR_WHY),
  entry("Υ", "Y", "Greek capital upsilon", "greek", GR_WHY),
  entry("Χ", "X", "Greek capital chi", "greek", GR_WHY),
  entry("α", "a", "Greek small alpha", "greek", GR_WHY),
  entry("ο", "o", "Greek small omicron", "greek", GR_WHY),
  entry("ν", "v", "Greek small nu", "greek", GR_WHY),
  entry("ρ", "p", "Greek small rho", "greek", GR_WHY),
  entry("τ", "t", "Greek small tau", "greek", GR_WHY),
  entry("υ", "u", "Greek small upsilon", "greek", GR_WHY),
  entry("χ", "x", "Greek small chi", "greek", GR_WHY),
  entry("ι", "i", "Greek small iota", "greek", GR_WHY),
  entry("κ", "k", "Greek small kappa", "greek", GR_WHY),
  entry("η", "n", "Greek small eta", "greek", GR_WHY),
  entry(
    "ɡ",
    "g",
    "Latin small script g",
    "compat",
    "IPA/script form that is not the ASCII letter a checker expects.",
  ),
  entry("ɑ", "a", "Latin small alpha", "compat", "Latin alpha, looks like a, is not U+0061."),
  entry("ℓ", "l", "Script small l", "compat", "Letterlike symbol used as a stand-in for l."),
];

const FULLWIDTH: HomoglyphMeta[] = [];
for (let i = 0; i < 26; i++) {
  FULLWIDTH.push(
    entry(
      String.fromCharCode(0xff21 + i),
      String.fromCharCode(65 + i),
      "Fullwidth " + String.fromCharCode(65 + i),
      "fullwidth",
      "Compatibility fullwidth capital. NFKC folds it; a raw matcher does not.",
    ),
    entry(
      String.fromCharCode(0xff41 + i),
      String.fromCharCode(97 + i),
      "Fullwidth " + String.fromCharCode(97 + i),
      "fullwidth",
      "Compatibility fullwidth small letter. A common copy-paste obfuscation.",
    ),
  );
}

export const HOMOGLYPHS: HomoglyphMeta[] = MANUAL.concat(FULLWIDTH);

export const HOMOGLYPH_MAP: Record<string, HomoglyphMeta> = Object.fromEntries(
  HOMOGLYPHS.map((m) => [m.from, m]),
);

const LATIN_TO_CYRILLIC: Record<string, string> = {
  a: "а",
  e: "е",
  o: "о",
  p: "р",
  c: "с",
  y: "у",
  x: "х",
  i: "і",
  s: "ѕ",
  d: "ԁ",
  h: "һ",
  A: "А",
  B: "В",
  E: "Е",
  K: "К",
  M: "М",
  H: "Н",
  O: "О",
  P: "Р",
  C: "С",
  T: "Т",
  X: "Х",
};

const LATIN_TO_GREEK: Record<string, string> = {
  a: "α",
  o: "ο",
  p: "ρ",
  x: "χ",
  v: "ν",
  i: "ι",
  u: "υ",
  A: "Α",
  B: "Β",
  E: "Ε",
  H: "Η",
  I: "Ι",
  K: "Κ",
  M: "Μ",
  O: "Ο",
  P: "Ρ",
  T: "Τ",
  X: "Χ",
};

export function scriptOf(ch: string): string {
  const c = ch.charCodeAt(0);
  if ((c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a) || (c >= 0xc0 && c <= 0x24f))
    return "latin";
  if (c >= 0x400 && c <= 0x52f) return "cyrillic";
  if (c >= 0x370 && c <= 0x3ff) return "greek";
  if (c >= 0xff00 && c <= 0xffef) return "fullwidth";
  return "other";
}

function snippet(text: string, from: number, to: number) {
  return text.slice(Math.max(0, from), Math.min(text.length, to)).replace(/\s+/g, " ");
}

function digitInWord(text: string, i: number, ch: string): string | null {
  if (ch !== "0" && ch !== "1") return null;
  let a = i;
  let b = i;
  while (a > 0 && /[A-Za-z0-9]/.test(text[a - 1])) a -= 1;
  while (b + 1 < text.length && /[A-Za-z0-9]/.test(text[b + 1])) b += 1;
  const word = text.slice(a, b + 1);
  const letters = (word.match(/[A-Za-z]/g) ?? []).length;
  if (letters < 2) return null;
  return ch === "0" ? "o" : "l";
}

export function inspectHomoglyphs(text: string): {
  hits: HomoglyphHit[];
  groups: {
    from: string;
    to: string;
    hex: string;
    name: string;
    script: GlyphScript;
    count: number;
    why: string;
  }[];
  mixedWords: MixedScriptWord[];
  folded: string;
  methods: {
    skeleton: number;
    nfkc: number;
    digit: number;
    tr39: number;
    mixedWords: number;
  };
} {
  const hits: HomoglyphHit[] = [];
  let folded = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const mapped = HOMOGLYPH_MAP[ch];
    if (mapped) {
      folded += mapped.to;
      hits.push({
        index: i,
        from: ch,
        to: mapped.to,
        hex: hexOf(mapped.code),
        name: mapped.name,
        script: mapped.script,
        why: mapped.why,
        method: mapped.script === "fullwidth" ? "nfkc" : "skeleton",
        before: snippet(text, i - 12, i),
        after: snippet(text, i + 1, i + 13),
      });
      continue;
    }
    const nfkc = ch.normalize("NFKC");
    if (nfkc !== ch && /^[A-Za-z0-9]$/.test(nfkc)) {
      folded += nfkc;
      hits.push({
        index: i,
        from: ch,
        to: nfkc,
        hex: hexOf(ch.charCodeAt(0)),
        name: "Compatibility character",
        script: "compat",
        why: "NFKC folds this to ASCII. A raw byte matcher would keep the lookalike.",
        method: "nfkc",
        before: snippet(text, i - 12, i),
        after: snippet(text, i + 1, i + 13),
      });
      continue;
    }
    const digit = digitInWord(text, i, ch);
    if (digit) {
      folded += digit;
      hits.push({
        index: i,
        from: ch,
        to: digit,
        hex: hexOf(ch.charCodeAt(0)),
        name: ch === "0" ? "Digit zero as letter o" : "Digit one as letter l",
        script: "digit",
        why: "A digit sitting inside a word is almost never a measurement, it is a substitution.",
        method: "digit-context",
        before: snippet(text, i - 12, i),
        after: snippet(text, i + 1, i + 13),
      });
      continue;
    }
    const tr39 = tr39Target(ch);
    if (tr39) {
      const s = scriptOf(ch);
      const script: GlyphScript =
        s === "cyrillic" || s === "greek" || s === "fullwidth" ? s : "compat";
      folded += tr39;
      hits.push({
        index: i,
        from: ch,
        to: tr39,
        hex: hexOf(ch.charCodeAt(0)),
        name: "UTS39 confusable",
        script,
        why: "unicode-confusables (UTS39), prose-safe: non-Latin lookalike folded, ASCII confusables ignored.",
        method: "tr39",
        before: snippet(text, i - 12, i),
        after: snippet(text, i + 1, i + 13),
      });
      continue;
    }
    folded += ch;
  }

  const tally = new Map<string, { meta: HomoglyphHit; count: number }>();
  for (const h of hits) {
    const key = h.hex + h.to;
    const cur = tally.get(key);
    if (cur) cur.count += 1;
    else tally.set(key, { meta: h, count: 1 });
  }
  const groups = [...tally.values()]
    .map(({ meta, count }) => ({
      from: meta.from,
      to: meta.to,
      hex: meta.hex,
      name: meta.name,
      script: meta.script,
      count,
      why: meta.why,
    }))
    .sort((a, b) => b.count - a.count);

  const mixed = mixedScriptWords(text);
  return {
    hits,
    groups,
    mixedWords: mixed,
    folded,
    methods: {
      skeleton: hits.filter((h) => h.method === "skeleton").length,
      nfkc: hits.filter((h) => h.method === "nfkc").length,
      digit: hits.filter((h) => h.method === "digit-context").length,
      tr39: hits.filter((h) => h.method === "tr39").length,
      mixedWords: mixed.length,
    },
  };
}

export function foldHomoglyphs(text: string) {
  const inspected = inspectHomoglyphs(text);
  const samples: string[] = [];
  for (const g of inspected.groups) {
    if (samples.length >= 6) break;
    samples.push(`‘${g.from}’ → ‘${g.to}’`);
  }
  return {
    text: inspected.folded,
    count: inspected.hits.length,
    samples,
  };
}

export function mixedScriptWords(text: string): MixedScriptWord[] {
  const out: MixedScriptWord[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const word = m[0];
    const scripts = new Set<string>();
    for (const ch of word) {
      const s = scriptOf(ch);
      if (s !== "other") scripts.add(s);
    }
    if (scripts.size >= 2) {
      out.push({ word, start: m.index, scripts: [...scripts] });
    }
  }
  return out.slice(0, 40);
}

function poisonWith(text: string, table: Record<string, string>) {
  let out = "";
  for (const ch of text) out += table[ch] ?? ch;
  return out;
}

export function poisonCyrillic(text: string) {
  return poisonWith(text, LATIN_TO_CYRILLIC);
}

export function poisonGreek(text: string) {
  return poisonWith(text, LATIN_TO_GREEK);
}

export function poisonFullwidth(text: string) {
  let out = "";
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    if (c >= 65 && c <= 90) out += String.fromCharCode(0xff21 + (c - 65));
    else if (c >= 97 && c <= 122) out += String.fromCharCode(0xff41 + (c - 97));
    else out += ch;
  }
  return out;
}

export function poisonDigits(text: string) {
  return text.replace(/[olOL]/g, (ch) => {
    if (ch === "o" || ch === "O") return "0";
    return "1";
  });
}

const CLEAN =
  "Beauchamp and Childress describe four clusters of moral principle that structure everyday nursing decisions: respect for autonomy, non-maleficence, beneficence and justice.";

export const HOMO_DEMOS: { id: string; label: string; hint: string; build: () => string }[] = [
  { id: "clean", label: "Clean ethics line", hint: "All Latin", build: () => CLEAN },
  {
    id: "cyrillic",
    label: "Cyrillic lookalikes",
    hint: "а е о р с",
    build: () => poisonCyrillic(CLEAN),
  },
  {
    id: "greek",
    label: "Greek lookalikes",
    hint: "ο α ρ χ",
    build: () => poisonGreek(CLEAN),
  },
  {
    id: "fullwidth",
    label: "Fullwidth Latin",
    hint: "NFKC fold",
    build: () =>
      "Respect for " +
      poisonFullwidth("autonomy") +
      " requires that a competent adult is given enough information to accept or refuse treatment.",
  },
  {
    id: "digits",
    label: "Digit substitutions",
    hint: "0 for o, 1 for l",
    build: () =>
      poisonDigits(
        "Blood loss of about 500 ml in the first day, or any loss that makes her unwell, counts as primary postpartum haemorrhage.",
      ),
  },
  {
    id: "mixed",
    label: "Mixed scripts in one word",
    hint: "Beauchamp poisoned",
    build: () =>
      "Вeаuchamр and Childress describe four clusters of moral рrinciple that structure everyday nursing decisions: respect for autonomy, non-maleficence, beneficence and justice.",
  },
];
