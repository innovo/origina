import { inspectHomoglyphs } from "./homoglyphs";
import { foldNfkc, foldTr39Prose, foldTr39Raw, type LibraryFold } from "./tr39";

export function foldOrigina(text: string): LibraryFold {
  const inspected = inspectHomoglyphs(text);
  return {
    id: "origina-prose",
    name: "Origina (wired)",
    folded: inspected.folded,
    hitCount: inspected.hits.length,
    hits: inspected.hits.map((h) => ({ point: h.from, similarTo: h.to })),
    note: "Hand map for nursing/IDN, NFKC, digit-in-word, then prose-safe UTS39 for anything still unmapped. Does not rewrite Beauchamp.",
  };
}

export function compareFolds(text: string): LibraryFold[] {
  return [foldOrigina(text), foldTr39Prose(text), foldTr39Raw(text), foldNfkc(text)];
}

export const LIBRARY_DEMOS: { id: string; label: string; hint: string; build: () => string }[] = [
  {
    id: "beauchamp",
    label: "Clean Beauchamp",
    hint: "ASCII false positive",
    build: () =>
      "Beauchamp and Childress describe four clusters of moral principle that structure everyday nursing decisions.",
  },
  {
    id: "cyrillic",
    label: "Cyrillic Beauchamp",
    hint: "Real homoglyphs",
    build: () =>
      "Вeаuchamр and Childress describe four clusters of moral рrinciple that structure everyday nursing decisions.",
  },
  {
    id: "who",
    label: "WHO omicron",
    hint: "IDN + prose",
    build: () =>
      "See the guideline at https://www.whο.int/publications for postpartum haemorrhage.",
  },
  {
    id: "fullwidth",
    label: "Fullwidth autonomy",
    hint: "NFKC vs UTS39",
    build: () => "Respect for ａｕｔｏｎｏｍｙ requires informed consent.",
  },
  {
    id: "apple",
    label: "Apple lookalike",
    hint: "Palochka ӏ",
    build: () => "The classic homograph is аррӏе.com, Cyrillic а, р, ӏ, е.",
  },
];
