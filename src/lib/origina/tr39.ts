import { confusables, isConfusing, rectifyConfusion } from "unicode-confusables";

export type LibraryId = "origina-prose" | "tr39-raw" | "tr39-prose" | "nfkc";

export type FoldHit = {
  point: string;
  similarTo: string;
  skipped?: "ascii-confusable" | "zero-width";
};

export type LibraryFold = {
  id: LibraryId;
  name: string;
  folded: string;
  hitCount: number;
  hits: FoldHit[];
  note: string;
};

function isBasicLatin(s: string) {
  if (!s) return false;
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (c < 0x20 || c > 0x7e) return false;
  }
  return true;
}

/** UTS39 skeleton as the unicode-confusables package implements it — including ASCII confusables such as m → rn. */
export function foldTr39Raw(text: string): LibraryFold {
  const parts = confusables(text);
  const hits: FoldHit[] = [];
  for (const p of parts) {
    if (p.similarTo == null) continue;
    hits.push({ point: p.point, similarTo: p.similarTo });
  }
  return {
    id: "tr39-raw",
    name: "unicode-confusables (UTS39 raw)",
    folded: rectifyConfusion(text),
    hitCount: hits.length,
    hits,
    note: "Official skeleton, including ASCII lookalikes. m becomes rn, so Beauchamp is flagged. Built for identifiers, not essays.",
  };
}

/**
 * Same table, minus ASCII→ASCII maps (m/rn, I/l, 0/O, 1/l) and minus zero-width
 * (those belong to the obfuscation agent). Safe to run on running academic prose.
 */
export function foldTr39Prose(text: string): LibraryFold {
  const parts = confusables(text);
  let folded = "";
  const hits: FoldHit[] = [];
  for (const p of parts) {
    if (p.similarTo == null) {
      folded += p.point;
      continue;
    }
    if (p.similarTo === "") {
      hits.push({ point: p.point, similarTo: "", skipped: "zero-width" });
      continue;
    }
    if (isBasicLatin(p.point) && isBasicLatin(p.similarTo)) {
      hits.push({ point: p.point, similarTo: p.similarTo, skipped: "ascii-confusable" });
      folded += p.point;
      continue;
    }
    hits.push({ point: p.point, similarTo: p.similarTo });
    folded += p.similarTo;
  }
  const applied = hits.filter((h) => !h.skipped);
  return {
    id: "tr39-prose",
    name: "UTS39, prose-safe",
    folded,
    hitCount: applied.length,
    hits,
    note: "Cyrillic, Greek and other non-Latin lookalikes still fold. Latin m, I, 0 and 1 are left alone so an ethics essay is not rewritten.",
  };
}

export function foldNfkc(text: string): LibraryFold {
  const folded = text.normalize("NFKC");
  let hitCount = 0;
  const hits: FoldHit[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const n = ch.normalize("NFKC");
    if (n !== ch) {
      hitCount += 1;
      if (hits.length < 24) hits.push({ point: ch, similarTo: n });
    }
  }
  return {
    id: "nfkc",
    name: "NFKC only",
    folded,
    hitCount,
    hits,
    note: "Compatibility normalisation. Fullwidth Latin collapses; Cyrillic а does not, because it is not a compatibility equivalent of a.",
  };
}

export function tr39Target(ch: string): string | null {
  const row = confusables(ch)[0];
  if (!row || row.similarTo == null || row.similarTo === "") return null;
  if (isBasicLatin(ch) && isBasicLatin(row.similarTo)) return null;
  return row.similarTo;
}

export function librarySurvey() {
  return [
    {
      id: "unicode-confusables",
      name: "unicode-confusables",
      weekly: "~276k",
      data: "UTS39 confusables.txt (Unicode 10)",
      size: "~96 KB JSON",
      use: "Identifiers, ENS-style names, IDN labels",
      skip: "Running prose — maps m → rn, I → l, 0 → O",
      wired: true,
    },
    {
      id: "confusables",
      name: "confusables",
      weekly: "~118k",
      data: "UTS39 skeletons",
      size: "~108 KB",
      use: "Same family as unicode-confusables",
      skip: "Same ASCII false positives",
      wired: false,
    },
    {
      id: "ens",
      name: "@ensdomains/unicode-confusables",
      weekly: "ENS stack",
      data: "Fork of unicode-confusables",
      size: "~102 KB",
      use: "Ethereum name homographs",
      skip: "Not a plagiarism engine",
      wired: false,
    },
    {
      id: "homoglyph-search",
      name: "homoglyph-search",
      weekly: "low",
      data: "UTS39 + extra pairs",
      size: "~56 KB",
      use: "Search for a banned word that has been disguised",
      skip: "Does not fold a whole script",
      wired: false,
    },
    {
      id: "decancer",
      name: "decancer",
      weekly: "~26k",
      data: "221k code points, leetspeak, bidi",
      size: "Rust native / WASM",
      use: "Moderation, zalgo, leetspeak",
      skip: "Native binaries; over-folds academic English",
      wired: false,
    },
    {
      id: "icu",
      name: "ICU SpoofChecker",
      weekly: "browsers",
      data: "UTS39 + restriction levels",
      size: "Native ICU",
      use: "Chrome/Edge IDN policy",
      skip: "Not a JavaScript dependency",
      wired: false,
    },
  ] as const;
}

export { isConfusing, confusables, rectifyConfusion };
