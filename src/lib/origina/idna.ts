import { toASCII, toUnicode } from "tr46";

/** IDNA2008 lookup / registration profile (UTS #46 nontransitional + RFC 5891 checks). */
export const IDNA2008_OPTS = {
  transitionalProcessing: false,
  useSTD3ASCIIRules: true,
  checkHyphens: true,
  checkBidi: true,
  checkJoiners: true,
  verifyDNSLength: true,
} as const;

/** IDNA2003-compatible lookup (UTS #46 transitional). Joiners are mapped away. */
export const IDNA2003_OPTS = {
  transitionalProcessing: true,
  useSTD3ASCIIRules: true,
  checkHyphens: true,
  checkBidi: true,
  checkJoiners: false,
  verifyDNSLength: true,
} as const;

export const DEVIATION_CHARS = [
  {
    char: "ß",
    code: 0x00df,
    hex: "U+00DF",
    name: "Latin small sharp s",
    mappedTo: "ss",
    why: "IDNA2003 Nameprep mapped ß → ss, so straße.de and strasse.de were the same name. IDNA2008 treats ß as PVALID: they are different A-labels.",
  },
  {
    char: "ς",
    code: 0x03c2,
    hex: "U+03C2",
    name: "Greek small final sigma",
    mappedTo: "σ",
    why: "IDNA2003 folded final sigma to σ. IDNA2008 leaves it. Two A-labels for what looks like the same Greek word.",
  },
  {
    char: "\u200C",
    code: 0x200c,
    hex: "U+200C",
    name: "Zero Width Non-Joiner",
    mappedTo: "(empty)",
    why: "CONTEXTJ in RFC 5892. Legal only between certain joining characters (Arabic, Indic). In a Latin host it is a hidden split that IDNA2008 rejects.",
  },
  {
    char: "\u200D",
    code: 0x200d,
    hex: "U+200D",
    name: "Zero Width Joiner",
    mappedTo: "(empty)",
    why: "The other CONTEXTJ mark. IDNA2003 stripped it and the label still resolved. IDNA2008 CheckJoiners fails the label.",
  },
] as const;

export const RFC_STACK = [
  {
    id: "5890",
    title: "RFC 5890",
    body: "Definitions. LDH labels, A-labels (xn--), U-labels, and what an IDN slot is.",
  },
  {
    id: "5891",
    title: "RFC 5891",
    body: "Protocol. Registration and lookup. No mapping in the protocol itself, that is the break from 2003.",
  },
  {
    id: "5892",
    title: "RFC 5892",
    body: "PVALID, CONTEXTJ, CONTEXTO, DISALLOWED, UNASSIGNED. The code-point table IDNA2008 actually uses.",
  },
  {
    id: "5893",
    title: "RFC 5893",
    body: "Bidi rule. An RTL label must start and end R/AL, and must not mix European and Arabic digits.",
  },
  {
    id: "5894",
    title: "RFC 5894",
    body: "Rationale. Why Nameprep was withdrawn, and why ß is allowed to stay ß.",
  },
  {
    id: "46",
    title: "UTS #46",
    body: "What browsers run. Transitional processing is deprecated; major clients are nontransitional (IDNA2008-compatible).",
  },
] as const;

export type IdnaProfile = {
  ascii: string | null;
  unicode: string;
  error: boolean;
};

export type DeviationHit = {
  hex: string;
  name: string;
  char: string;
  mappedTo: string;
};

export type IdnaReport = {
  input: string;
  idna2003: IdnaProfile;
  idna2008: IdnaProfile;
  diverge: boolean;
  deviations: DeviationHit[];
  issues: string[];
};

export function hostFromText(text: string): string {
  const trimmed = text.trim();
  const url = trimmed.match(/https?:\/\/[^\s<>"']+/i);
  const raw = url ? url[0] : (trimmed.split(/\s/)[0] ?? trimmed);
  return raw
    .replace(/^https?:\/\//i, "")
    .split(/[/:?#]/)[0]
    .replace(/\.$/, "");
}

function deviationsIn(host: string): DeviationHit[] {
  const found: DeviationHit[] = [];
  const seen = new Set<string>();
  for (const ch of host) {
    const row = DEVIATION_CHARS.find((d) => d.char === ch);
    if (!row || seen.has(row.hex)) continue;
    seen.add(row.hex);
    found.push({
      hex: row.hex,
      name: row.name,
      char: row.char === "\u200C" || row.char === "\u200D" ? row.hex : row.char,
      mappedTo: row.mappedTo,
    });
  }
  return found;
}

export function processIdna(host: string): IdnaReport {
  const input = host.trim().replace(/\.$/, "");
  const ascii2003 = toASCII(input, IDNA2003_OPTS);
  const ascii2008 = toASCII(input, IDNA2008_OPTS);
  const uni2003 = toUnicode(input, IDNA2003_OPTS);
  const uni2008 = toUnicode(input, IDNA2008_OPTS);
  const decoded = uni2008.domain || uni2003.domain || input;
  const deviations = deviationsIn(input + decoded);

  const issues: string[] = [];
  if (ascii2003 && ascii2008 && ascii2003 !== ascii2008) {
    issues.push(
      `A-labels diverge: IDNA2003 produces ${ascii2003}, IDNA2008 produces ${ascii2008}. Resolvers on each side will not see the same name.`,
    );
  }
  if (!ascii2008 && ascii2003) {
    issues.push(
      `IDNA2008 rejects this host. An IDNA2003 / transitional resolver would still emit ${ascii2003}.`,
    );
  }
  if (!ascii2008 && !ascii2003) {
    issues.push(
      "Both profiles reject this host (STD3, hyphens, length, or DISALLOWED code points).",
    );
  }
  if (uni2008.error && ascii2008) {
    issues.push("U-label processing reported an error even though an A-label was produced.");
  }
  for (const d of deviations) {
    const meta = DEVIATION_CHARS.find((x) => x.hex === d.hex);
    if (meta) issues.push(`${d.hex} ${d.name}: ${meta.why}`);
  }
  if (!issues.length) {
    issues.push(
      "IDNA2003 transitional and IDNA2008 nontransitional agree. STD3, Bidi and Joiners pass.",
    );
  }

  return {
    input,
    idna2003: {
      ascii: ascii2003,
      unicode: uni2003.domain,
      error: uni2003.error || ascii2003 === null,
    },
    idna2008: {
      ascii: ascii2008,
      unicode: uni2008.domain,
      error: uni2008.error || ascii2008 === null,
    },
    diverge: Boolean((ascii2003 || ascii2008) && ascii2003 !== ascii2008),
    deviations,
    issues,
  };
}

export const IDNA_DEMOS: { id: string; label: string; hint: string; build: () => string }[] = [
  {
    id: "who",
    label: "Clean WHO",
    hint: "Both profiles agree",
    build: () => "www.who.int",
  },
  {
    id: "strasse",
    label: "straße.de",
    hint: "ß deviation",
    build: () => "straße.de",
  },
  {
    id: "fass",
    label: "faß.de",
    hint: "The UTS #46 example",
    build: () => "faß.de",
  },
  {
    id: "sigma",
    label: "Final sigma",
    hint: "U+03C2",
    build: () => "example.ςom",
  },
  {
    id: "zwj",
    label: "ZWJ in a Latin label",
    hint: "CONTEXTJ fail",
    build: () => "who.\u200Dint",
  },
  {
    id: "zwnj",
    label: "ZWNJ in a Latin label",
    hint: "CONTEXTJ fail",
    build: () => "doi.\u200Corg",
  },
  {
    id: "std3",
    label: "Underscore (STD3)",
    hint: "DISALLOWED ASCII",
    build: () => "hello_world.com",
  },
  {
    id: "apple",
    label: "Apple punycode",
    hint: "Valid IDN, still a homograph",
    build: () => "www.xn--80ak6aa92e.com",
  },
];
