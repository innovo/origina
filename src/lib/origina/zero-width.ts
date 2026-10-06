export type InvisibleCategory = "zero-width" | "bidi" | "format" | "filler";

export type InvisibleMeta = {
  code: number;
  name: string;
  short: string;
  category: InvisibleCategory;
  why: string;
};

export type InvisibleHit = {
  index: number;
  code: number;
  hex: string;
  name: string;
  short: string;
  category: InvisibleCategory;
  why: string;
  before: string;
  after: string;
};

export const INVISIBLES: InvisibleMeta[] = [
  {
    code: 0x200b,
    name: "Zero Width Space",
    short: "ZWSP",
    category: "zero-width",
    why: "The usual plagiarism dodge: slip it inside a word so tokenisers split a copied phrase.",
  },
  {
    code: 0x200c,
    name: "Zero Width Non-Joiner",
    short: "ZWNJ",
    category: "zero-width",
    why: "Breaks cursive joining and, in Latin text, sits invisibly between letters.",
  },
  {
    code: 0x200d,
    name: "Zero Width Joiner",
    short: "ZWJ",
    category: "zero-width",
    why: "Meant for emoji sequences; in an essay it is almost never legitimate.",
  },
  {
    code: 0x2060,
    name: "Word Joiner",
    short: "WJ",
    category: "zero-width",
    why: "A non-breaking zero-width glue. Same evasion as ZWSP, harder to spot in some fonts.",
  },
  {
    code: 0xfeff,
    name: "Byte Order Mark / ZWNBSP",
    short: "BOM",
    category: "zero-width",
    why: "A UTF-16 leftover. Cheaters paste it through a document to pad or split tokens.",
  },
  {
    code: 0x180e,
    name: "Mongolian Vowel Separator",
    short: "MVS",
    category: "zero-width",
    why: "Deprecated, still present in cheat tools. Has no business in a nursing script.",
  },
  {
    code: 0x2061,
    name: "Function Application",
    short: "FA",
    category: "zero-width",
    why: "MathML invisibles reused as hidden separators in prose.",
  },
  {
    code: 0x2062,
    name: "Invisible Times",
    short: "IT",
    category: "zero-width",
    why: "Another math operator with no visible glyph, inserted between letters.",
  },
  {
    code: 0x2063,
    name: "Invisible Separator",
    short: "ISEP",
    category: "zero-width",
    why: "Invisible comma analogue. Splits tokens without a mark on the page.",
  },
  {
    code: 0x2064,
    name: "Invisible Plus",
    short: "IPLUS",
    category: "zero-width",
    why: "Same family as Invisible Times, not used in running academic English.",
  },
  {
    code: 0x206a,
    name: "Inhibit Symmetric Swapping",
    short: "ISS",
    category: "zero-width",
    why: "Deprecated format control. A fingerprint of automated obfuscators.",
  },
  {
    code: 0x206b,
    name: "Activate Symmetric Swapping",
    short: "ASS",
    category: "zero-width",
    why: "Deprecated format control, paired with ISS.",
  },
  {
    code: 0x206c,
    name: "Inhibit Arabic Form Shaping",
    short: "IAFS",
    category: "zero-width",
    why: "Deprecated. Noise in a Latin or Afrikaans submission.",
  },
  {
    code: 0x206d,
    name: "Activate Arabic Form Shaping",
    short: "AAFS",
    category: "zero-width",
    why: "Deprecated counterpart of IAFS.",
  },
  {
    code: 0x206e,
    name: "National Digit Shapes",
    short: "NADS",
    category: "zero-width",
    why: "Deprecated digit-shape control, not a letter a student typed.",
  },
  {
    code: 0x206f,
    name: "Nominal Digit Shapes",
    short: "NODS",
    category: "zero-width",
    why: "Deprecated digit-shape control.",
  },
  {
    code: 0x00ad,
    name: "Soft Hyphen",
    short: "SHY",
    category: "format",
    why: "Optional hyphen. Sprayed through a paragraph it fractures words without a visible dash.",
  },
  {
    code: 0x034f,
    name: "Combining Grapheme Joiner",
    short: "CGJ",
    category: "format",
    why: "A combining mark with no glyph of its own. Splits or joins graphemes invisibly.",
  },
  {
    code: 0x200e,
    name: "Left-to-Right Mark",
    short: "LRM",
    category: "bidi",
    why: "Direction mark. Harmless in mixed-script UI; in a monolingual essay it is a tell.",
  },
  {
    code: 0x200f,
    name: "Right-to-Left Mark",
    short: "RLM",
    category: "bidi",
    why: "Forces RTL at a point in the string without a visible character.",
  },
  {
    code: 0x202a,
    name: "Left-to-Right Embedding",
    short: "LRE",
    category: "bidi",
    why: "Opens a directional embed. Used to hide or reorder copied spans.",
  },
  {
    code: 0x202b,
    name: "Right-to-Left Embedding",
    short: "RLE",
    category: "bidi",
    why: "Opens an RTL embed, the start of many ‘hidden text’ tricks.",
  },
  {
    code: 0x202c,
    name: "Pop Directional Formatting",
    short: "PDF",
    category: "bidi",
    why: "Closes an embedding or override. Always appears with LRE/RLO in poisoned files.",
  },
  {
    code: 0x202d,
    name: "Left-to-Right Override",
    short: "LRO",
    category: "bidi",
    why: "Forces LTR rendering of the following characters.",
  },
  {
    code: 0x202e,
    name: "Right-to-Left Override",
    short: "RLO",
    category: "bidi",
    why: "The ‘trojan source’ mark: later letters display reversed. Spec 2.1.6.",
  },
  {
    code: 0x2066,
    name: "Left-to-Right Isolate",
    short: "LRI",
    category: "bidi",
    why: "Modern isolate. Same family as embeddings, used by newer obfuscators.",
  },
  {
    code: 0x2067,
    name: "Right-to-Left Isolate",
    short: "RLI",
    category: "bidi",
    why: "RTL isolate, conceals direction changes from a casual read.",
  },
  {
    code: 0x2068,
    name: "First Strong Isolate",
    short: "FSI",
    category: "bidi",
    why: "Direction isolate that follows the first strong character.",
  },
  {
    code: 0x2069,
    name: "Pop Directional Isolate",
    short: "PDI",
    category: "bidi",
    why: "Closes LRI/RLI/FSI. A paired fingerprint.",
  },
  {
    code: 0x3164,
    name: "Hangul Filler",
    short: "HF",
    category: "filler",
    why: "Looks like a space in some fonts, copies as a letter. A known cheat glyph.",
  },
  {
    code: 0x115f,
    name: "Hangul Choseong Filler",
    short: "HCF",
    category: "filler",
    why: "Jamo filler with no visible syllable. Used as a blank that is not a space.",
  },
  {
    code: 0x1160,
    name: "Hangul Jungseong Filler",
    short: "HJF",
    category: "filler",
    why: "Jamo vowel filler. Same dodge as the choseong filler.",
  },
  {
    code: 0xffa0,
    name: "Halfwidth Hangul Filler",
    short: "HWHF",
    category: "filler",
    why: "Halfwidth form of the Hangul filler, still invisible in Latin prose.",
  },
  {
    code: 0x2800,
    name: "Braille Pattern Blank",
    short: "BPB",
    category: "filler",
    why: "A Braille cell with no dots. Renders as empty, counts as a character.",
  },
];

export const INVISIBLE_BY_CODE: Record<number, InvisibleMeta> = Object.fromEntries(
  INVISIBLES.map((m) => [m.code, m]),
);

function toClassRange() {
  return INVISIBLES.map((m) => "\\u" + m.code.toString(16).padStart(4, "0")).join("");
}

export const INVISIBLE_REGEX = new RegExp("[" + toClassRange() + "]", "g");

export const ZERO_WIDTH_REGEX = new RegExp(
  "[" +
    INVISIBLES.filter(
      (m) => m.category === "zero-width" || m.category === "format" || m.category === "filler",
    )
      .map((m) => "\\u" + m.code.toString(16).padStart(4, "0"))
      .join("") +
    "]",
  "g",
);

export const BIDI_REGEX = new RegExp(
  "[" +
    INVISIBLES.filter((m) => m.category === "bidi")
      .map((m) => "\\u" + m.code.toString(16).padStart(4, "0"))
      .join("") +
    "]",
  "g",
);

function snippet(text: string, from: number, to: number) {
  return text.slice(Math.max(0, from), Math.min(text.length, to)).replace(/\s+/g, " ");
}

export function hexOf(code: number) {
  return "U+" + code.toString(16).toUpperCase().padStart(4, "0");
}

export function inspectInvisible(text: string): {
  hits: InvisibleHit[];
  groups: {
    code: number;
    hex: string;
    name: string;
    short: string;
    category: InvisibleCategory;
    count: number;
    why: string;
  }[];
  rawLength: number;
  visibleLength: number;
  cleaned: string;
  splitWords: string[];
} {
  const hits: InvisibleHit[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const meta = INVISIBLE_BY_CODE[code];
    if (!meta) continue;
    hits.push({
      index: i,
      code,
      hex: hexOf(code),
      name: meta.name,
      short: meta.short,
      category: meta.category,
      why: meta.why,
      before: snippet(text, i - 16, i),
      after: snippet(text, i + 1, i + 17),
    });
  }
  const tally = new Map<number, number>();
  for (const h of hits) tally.set(h.code, (tally.get(h.code) ?? 0) + 1);
  const groups = [...tally.entries()]
    .map(([code, count]) => {
      const meta = INVISIBLE_BY_CODE[code];
      return {
        code,
        hex: hexOf(code),
        name: meta.name,
        short: meta.short,
        category: meta.category,
        count,
        why: meta.why,
      };
    })
    .sort((a, b) => b.count - a.count);

  const cleaned = stripInvisible(text);
  return {
    hits,
    groups,
    rawLength: text.length,
    visibleLength: cleaned.length,
    cleaned,
    splitWords: splitWords(cleaned),
  };
}

export function stripInvisible(text: string) {
  return text.replace(INVISIBLE_REGEX, "");
}

export function naiveWords(text: string) {
  return text.match(/[A-Za-zÀ-öø-ÿ0-9']+/g) ?? [];
}

export function splitWords(text: string) {
  return naiveWords(text);
}

/** Classic evasion: ZWSP between every letter of each word. */
export function poisonLetters(text: string, code = 0x200b) {
  const glue = String.fromCharCode(code);
  return text.replace(/[A-Za-zÀ-öø-ÿ]+/g, (word) => word.split("").join(glue));
}

export function poisonWordGaps(text: string, code = 0x200b) {
  const glue = String.fromCharCode(code);
  return text.replace(/ +/g, glue + " " + glue);
}

export const POISON_DEMOS: { id: string; label: string; hint: string; build: () => string }[] = [
  {
    id: "clean",
    label: "Clean protocol line",
    hint: "No concealment",
    build: () =>
      "The primary survey in major trauma follows a strict ABCDE sequence so that immediately life-threatening problems are found and treated before moving on.",
  },
  {
    id: "between-words",
    label: "ZWSP between words",
    hint: "U+200B in the gaps",
    build: () =>
      poisonWordGaps(
        "The primary survey in major trauma follows a strict ABCDE sequence so that immediately life-threatening problems are found and treated before moving on.",
      ),
  },
  {
    id: "inside-words",
    label: "ZWSP inside words",
    hint: "Breaks tokenisers",
    build: () =>
      poisonLetters(
        "Safe medication administration in nursing practice is organised around the five rights.",
      ),
  },
  {
    id: "mixed",
    label: "Mixed marks",
    hint: "ZWSP, ZWNJ, BOM, SHY",
    build: () => {
      const bom = "\uFEFF";
      const zwnj = "\u200C";
      const shy = "\u00AD";
      return (
        bom +
        "Identity is confirmed with two iden" +
        zwnj +
        "tifiers, never a bed num" +
        shy +
        "ber alone. The medication is checked against the original prescrip" +
        "\u200B" +
        "tion."
      );
    },
  },
  {
    id: "rlo",
    label: "Bidi override (RLO)",
    hint: "Trojan-source display",
    build: () =>
      "Document the survey as " +
      "\u202E" +
      "ABCDE" +
      "\u202C" +
      " and reassess continuously. Any deterioration returns the clinician to airway.",
  },
  {
    id: "filler",
    label: "Hangul / Braille blanks",
    hint: "Looks empty, is not a space",
    build: () =>
      "Circulation addresses catastrophic" +
      "\u3164" +
      "haemorrhage, pulse quality, skin colour and capillary" +
      "\u2800" +
      "refill.",
  },
];
