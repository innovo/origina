import { foldHomoglyphs, scriptOf } from "./homoglyphs";
import { hostToAscii, hostToUnicode } from "./punycode";
import { inspectInvisible } from "./zero-width";
import { processIdna, type IdnaReport } from "./idna";

export type IdnSeverity = "ok" | "warn" | "risk";

export type IdnFinding = {
  raw: string;
  host: string;
  unicodeHost: string;
  punycodeHost: string;
  skeleton: string;
  scripts: string[];
  mixedScript: boolean;
  hasPunycode: boolean;
  hiddenMarks: number;
  spoofOf: string | null;
  reasons: string[];
  severity: IdnSeverity;
  idna: IdnaReport | null;
};

/** Registrable hosts a WCCN/CEC script is expected to cite. */
export const TRUSTED_HOSTS = [
  "pubmed.ncbi.nlm.nih.gov",
  "ncbi.nlm.nih.gov",
  "nih.gov",
  "doi.org",
  "who.int",
  "cdc.gov",
  "cochrane.org",
  "nice.org.uk",
  "gov.za",
  "westerncape.gov.za",
  "sanc.co.za",
  "scholar.google.com",
  "google.com",
  "wikipedia.org",
  "sciencedirect.com",
  "springer.com",
  "wiley.com",
  "jstor.org",
  "moodle.org",
  "paypal.com",
  "apple.com",
  "microsoft.com",
  "github.com",
  "nlm.nih.gov",
];

const URL_RE =
  /\b(?:https?:\/\/|www\.)[^\s<>"'）\]>]+|\b(?:pubmed\.ncbi\.nlm\.nih\.gov|doi\.org|who\.int)\/[^\s<>"']+/gi;

function stripTrail(s: string) {
  return s.replace(/[.,;:!?)]+$/g, "");
}

export function extractUrls(text: string): { raw: string; index: number }[] {
  const out: { raw: string; index: number }[] = [];
  const seen = new Set<string>();
  const re = new RegExp(URL_RE.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const raw = stripTrail(m[0]);
    if (raw.length < 8 || seen.has(raw)) continue;
    seen.add(raw);
    out.push({ raw, index: m.index });
  }
  return out;
}

function parseHost(raw: string): string | null {
  const withScheme = /^https?:\/\//i.test(raw) ? raw : "https://" + raw;
  const m = withScheme.match(/^https?:\/\/([^/:?#]+)/i);
  return m ? m[1] : null;
}

function asciiHostOf(rawHost: string): string {
  const cleaned = inspectInvisible(rawHost).cleaned || rawHost;
  try {
    const u = new URL("https://" + cleaned);
    if (u.hostname) return u.hostname;
  } catch {
    /* ignore */
  }
  return hostToAscii(cleaned);
}

function scriptsIn(host: string): string[] {
  const set = new Set<string>();
  for (const ch of host) {
    if (ch === "." || ch === "-") continue;
    const s = scriptOf(ch);
    if (s !== "other") set.add(s);
  }
  return [...set];
}

function mixedScriptLabels(unicodeHost: string): boolean {
  for (const label of unicodeHost.split(".")) {
    const set = new Set<string>();
    for (const ch of label) {
      if (ch === "-") continue;
      const s = scriptOf(ch);
      if (s !== "other") set.add(s);
    }
    if (set.size >= 2) return true;
  }
  return false;
}

function matchTrusted(skeleton: string): string | null {
  const s = skeleton.toLowerCase();
  for (const t of TRUSTED_HOSTS) {
    if (s === t) return t;
    if (s.endsWith("." + t)) return t;
  }
  return null;
}

function hostIsTrusted(h: string, trusted: string) {
  const x = h.toLowerCase();
  return x === trusted || x.endsWith("." + trusted);
}

export function inspectHost(rawUrl: string): IdnFinding | null {
  const extracted = parseHost(rawUrl);
  if (!extracted) return null;
  const hidden = inspectInvisible(extracted);
  const asciiHost = asciiHostOf(extracted);
  const unicodeHost = hostToUnicode(asciiHost);
  const skeletonHost = foldHomoglyphs(unicodeHost).text.toLowerCase();
  const scripts = scriptsIn(unicodeHost);
  const mixed = mixedScriptLabels(unicodeHost);
  const punycodeHost = asciiHost;
  const hasPunycode = /(^|\.)xn--/i.test(extracted) || /(^|\.)xn--/i.test(asciiHost);
  const idna = processIdna(extracted);
  const trusted = matchTrusted(skeletonHost);
  const actuallyTrusted =
    trusted !== null &&
    hostIsTrusted(unicodeHost, trusted) &&
    unicodeHost.toLowerCase() === skeletonHost &&
    !mixed &&
    hidden.hits.length === 0;

  const reasons: string[] = [];
  let spoofOf: string | null = null;
  let severity: IdnSeverity = "ok";

  if (hidden.hits.length) {
    reasons.push(
      `${hidden.hits.length} zero-width or format mark${hidden.hits.length === 1 ? "" : "s"} inside the host.`,
    );
    severity = "risk";
  }
  if (mixed) {
    reasons.push(
      `Mixed scripts in one DNS label (${scripts.join(" + ")}). Browsers treat this as an IDN homograph.`,
    );
    severity = "risk";
  }
  if (trusted && !actuallyTrusted) {
    if (!(hidden.hits.length && !mixed && hostIsTrusted(skeletonHost, trusted))) {
      spoofOf = trusted;
      reasons.push(`Skeleton folds to ${trusted}, but the registered host is not ${trusted}.`);
    }
    severity = "risk";
  } else if (hasPunycode && !actuallyTrusted) {
    reasons.push(`Punycode (ACE) label present — the wire form is ${punycodeHost}.`);
    if (severity === "ok") severity = "warn";
  } else if (scripts.some((s) => s !== "latin") && !actuallyTrusted) {
    reasons.push(`Non-Latin characters in the host (${scripts.join(", ")}).`);
    if (severity === "ok") severity = "warn";
  }

  if (idna.diverge) {
    reasons.push(
      `IDNA2003 and IDNA2008 produce different A-labels (${idna.idna2003.ascii ?? "rejected"} vs ${idna.idna2008.ascii ?? "rejected"}).`,
    );
    if (severity === "ok") severity = "warn";
  } else if (!idna.idna2008.ascii && idna.idna2003.ascii) {
    reasons.push(
      `IDNA2008 rejects this host. A transitional (IDNA2003) resolver would still emit ${idna.idna2003.ascii}.`,
    );
    severity = "risk";
  } else if (!idna.idna2008.ascii && !idna.idna2003.ascii) {
    reasons.push("IDNA2008 STD3 / Bidi / Joiners / length checks reject this host.");
    if (severity === "ok") severity = "warn";
  }

  if (!reasons.length) reasons.push("Host is ASCII and does not fold onto a watched brand.");

  return {
    raw: rawUrl,
    host: extracted,
    unicodeHost,
    punycodeHost,
    skeleton: skeletonHost,
    scripts,
    mixedScript: mixed,
    hasPunycode,
    hiddenMarks: hidden.hits.length,
    spoofOf,
    reasons,
    severity,
    idna,
  };
}

export function inspectTextUrls(text: string): {
  findings: IdnFinding[];
  risk: number;
  warn: number;
} {
  const findings: IdnFinding[] = [];
  for (const u of extractUrls(text)) {
    const f = inspectHost(u.raw);
    if (f) findings.push(f);
  }
  return {
    findings,
    risk: findings.filter((f) => f.severity === "risk").length,
    warn: findings.filter((f) => f.severity === "warn").length,
  };
}

const CLEAN_WHO = "https://www.who.int/publications";
const CLEAN_PUBMED = "https://pubmed.ncbi.nlm.nih.gov/12345678";

export const IDN_DEMOS: { id: string; label: string; hint: string; build: () => string }[] = [
  {
    id: "clean",
    label: "Clean WHO + PubMed",
    hint: "Trusted ASCII",
    build: () =>
      `Postpartum haemorrhage remains a leading cause of maternal death (WHO, 2023). ${CLEAN_WHO}\nSee also the trial summary at ${CLEAN_PUBMED}`,
  },
  {
    id: "who-omicron",
    label: "WHO with Greek omicron",
    hint: "whο.int",
    build: () =>
      `Guidance was taken from the World Health Organization at https://www.whο.int/publications — the omicron is Greek U+03BF, not Latin o.`,
  },
  {
    id: "pubmed-i",
    label: "PubMed with Ukrainian i",
    hint: "nіh.gov",
    build: () =>
      `The five rights of medication administration are summarised at https://pubmed.ncbi.nlm.nіh.gov/31415926 (Cyrillic і in nih).`,
  },
  {
    id: "paypal",
    label: "PayPal Cyrillic spoof",
    hint: "раypal.com",
    build: () =>
      `Students sometimes paste a “source” that is a brand spoof. Classic example: https://www.раypal.com/login uses Cyrillic р and а.`,
  },
  {
    id: "apple-punycode",
    label: "Apple as punycode",
    hint: "xn--80ak6aa92e",
    build: () =>
      `The 2017 homograph demo encoded аррӏе.com as ACE so the address bar showed a Latin brand: https://www.xn--80ak6aa92e.com/`,
  },
  {
    id: "zw-host",
    label: "Zero-width in the host",
    hint: "doi.org + ZWSP",
    build: () =>
      `A DOI that is not a DOI: https://doi.\u200Borg/10.1000/xyz — a zero-width space sits in the host.`,
  },
];
