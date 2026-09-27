/** RFC 3492 Punycode, encode + decode of a single DNS label (no ACE prefix). */

const BASE = 36;
const TMIN = 1;
const TMAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;

function adapt(delta: number, numPoints: number, firstTime: boolean) {
  let d = firstTime ? Math.floor(delta / DAMP) : delta >> 1;
  d += Math.floor(d / numPoints);
  let k = 0;
  while (d > ((BASE - TMIN) * TMAX) >> 1) {
    d = Math.floor(d / (BASE - TMIN));
    k += BASE;
  }
  return k + Math.floor(((BASE - TMIN + 1) * d) / (d + SKEW));
}

function digitToChar(d: number) {
  return String.fromCharCode(d + 22 + 75 * (d < 26 ? 1 : 0));
}

function charToDigit(code: number) {
  if (code - 48 < 10) return code - 22;
  if (code - 65 < 26) return code - 65;
  if (code - 97 < 26) return code - 97;
  return BASE;
}

export function punycodeDecode(input: string): string {
  const output: number[] = [];
  let n = INITIAL_N;
  let i = 0;
  let bias = INITIAL_BIAS;
  const lastDelim = input.lastIndexOf("-");
  if (lastDelim >= 0) {
    for (let j = 0; j < lastDelim; j++) {
      const c = input.charCodeAt(j);
      if (c >= 0x80) throw new Error("punycode: non-basic in prefix");
      output.push(c);
    }
  }
  let idx = lastDelim >= 0 ? lastDelim + 1 : 0;
  while (idx < input.length) {
    const oldi = i;
    let w = 1;
    for (let k = BASE; ; k += BASE) {
      if (idx >= input.length) throw new Error("punycode: overflow");
      const digit = charToDigit(input.charCodeAt(idx++));
      if (digit >= BASE) throw new Error("punycode: invalid digit");
      i += digit * w;
      const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
      if (digit < t) break;
      w *= BASE - t;
    }
    const out = output.length + 1;
    bias = adapt(i - oldi, out, oldi === 0);
    n += Math.floor(i / out);
    i %= out;
    output.splice(i, 0, n);
    i += 1;
  }
  return String.fromCodePoint(...output);
}

export function punycodeEncode(input: string): string {
  const cps = [...input].map((ch) => ch.codePointAt(0)!);
  const output: string[] = [];
  const basic = cps.filter((c) => c < 0x80);
  for (const c of basic) output.push(String.fromCharCode(c));
  let handled = basic.length;
  if (handled) output.push("-");
  let n = INITIAL_N;
  let delta = 0;
  let bias = INITIAL_BIAS;
  while (handled < cps.length) {
    let m = 0x10ffff;
    for (const c of cps) if (c >= n && c < m) m = c;
    delta += (m - n) * (handled + 1);
    n = m;
    for (const c of cps) {
      if (c < n) delta += 1;
      if (c === n) {
        let q = delta;
        for (let k = BASE; ; k += BASE) {
          const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
          if (q < t) {
            output.push(digitToChar(q));
            break;
          }
          output.push(digitToChar(t + ((q - t) % (BASE - t))));
          q = Math.floor((q - t) / (BASE - t));
        }
        bias = adapt(delta, handled + 1, handled === basic.length);
        delta = 0;
        handled += 1;
      }
    }
    delta += 1;
    n += 1;
  }
  return output.join("");
}

export function decodeIdnLabel(label: string): string {
  const lower = label.toLowerCase();
  if (!lower.startsWith("xn--")) return label;
  try {
    return punycodeDecode(lower.slice(4));
  } catch {
    return label;
  }
}

export function encodeIdnLabel(label: string): string {
  if (/^[\x00-\x7F]+$/.test(label)) return label;
  try {
    return "xn--" + punycodeEncode(label);
  } catch {
    return label;
  }
}

export function hostToUnicode(host: string): string {
  return host
    .split(".")
    .map((l) => decodeIdnLabel(l))
    .join(".");
}

export function hostToAscii(host: string): string {
  return host
    .split(".")
    .map((l) => encodeIdnLabel(l))
    .join(".");
}
