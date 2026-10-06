function stripTags(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Decode the HTML/XML entities that survive tag stripping. */
function decodeEntities(text: string) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&");
}

function decodePdfString(raw: string) {
  return raw
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\(\d{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

export function extractPdfText(buffer: ArrayBuffer): string {
  const raw = new TextDecoder("latin1").decode(buffer);
  const chunks: string[] = [];
  const tj = /\((?:\\.|[^\\)])*\)\s*Tj/g;
  let m: RegExpExecArray | null;
  while ((m = tj.exec(raw))) {
    const inner = m[0].replace(/\s*Tj$/, "");
    chunks.push(decodePdfString(inner.slice(1, -1)));
  }
  const arr = /\[(.*?)\]\s*TJ/gs;
  while ((m = arr.exec(raw))) {
    const inner = m[1];
    const parts = inner.match(/\((?:\\.|[^\\)])*\)/g) ?? [];
    for (const p of parts) chunks.push(decodePdfString(p.slice(1, -1)));
  }
  const joined = chunks.join(" ").replace(/\s+/g, " ").trim();
  return joined;
}

/** Real PDF text via pdf.js (handles compressed streams); falls back to the raw scan. */
async function extractPdf(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  try {
    const pdfjs = await import("pdfjs-dist");
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : "") : ""))
          .join(""),
      );
    }
    await doc.destroy();
    const text = pages.join("\n\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    if (text.length >= 40) return text;
  } catch (err) {
    console.warn("[extract] pdf.js failed, using fallback", err);
  }
  return extractPdfText(buf);
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return result.value.replace(/\s+\n/g, "\n").trim();
}

async function extractPptx(file: File): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slideNo = (n: string) => Number(n.match(/slide(\d+)\.xml$/i)?.[1] ?? 0);
  const names = Object.keys(zip.files)
    .filter((n) => /ppt\/slides\/slide\d+\.xml$/i.test(n))
    .sort((a, b) => slideNo(a) - slideNo(b));
  const parts: string[] = [];
  for (const name of names) {
    const xml = await zip.files[name].async("string");
    const texts = [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)].map((x) => decodeEntities(x[1]));
    if (texts.length) parts.push(texts.join(" "));
  }
  return parts.join("\n\n").replace(/\s+/g, " ").trim();
}

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".docx")) return extractDocx(file);
  if (name.endsWith(".pptx") || name.endsWith(".ppt")) {
    if (name.endsWith(".ppt") && !name.endsWith(".pptx")) {
      throw new Error("Legacy .ppt is not supported. Please save as .pptx or paste the text.");
    }
    return extractPptx(file);
  }
  if (name.endsWith(".pdf")) {
    const text = await extractPdf(file);
    if (text.length < 40) {
      throw new Error(
        "This PDF looks scanned or image-based. Paste the text, or export a text PDF.",
      );
    }
    return text;
  }
  if (name.endsWith(".html") || name.endsWith(".htm")) {
    return decodeEntities(stripTags(await file.text()));
  }
  if (name.endsWith(".doc")) {
    throw new Error("Legacy .doc is not supported. Please save as .docx or paste the text.");
  }
  return (await file.text()).trim();
}
