import { analyseLocal } from "./engine";
import { SAMPLE_TEXTS } from "./corpus";
import { DISCLAIMER, type Findings } from "./types";

const copied = SAMPLE_TEXTS.find((s) => s.id === "copied")!;

export const SAMPLE_REPORT_TEXT = copied.text;

export const SAMPLE_FINDINGS: Findings = (() => {
  const base = analyseLocal({ text: copied.text });
  return {
    ...base,
    ai: {
      likelihood: 22,
      confidence: "low",
      summary:
        "The writing follows a textbook sequence closely, with little personal voice. That pattern is consistent with copying a source rather than with a generative model. Treat the similarity score as the primary concern.",
      indicators: [
        "Long unbroken restatement of a known clinical protocol",
        "Little first-person reflection for a supposed student essay",
        "Generic closing sentence that does not add clinical judgement",
      ],
      passages: [],
      translationSuspicion: false,
      paraphraseSuspicion: false,
      unavailable: false,
    },
    disclaimer: DISCLAIMER,
  };
})();
