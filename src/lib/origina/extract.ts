function stripTags(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/\s+/g, " ")
    .trim();
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

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return result.value.replace(/\s+\n/g, "\n").trim();
}

async function extractPptx(file: File): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const names = Object.keys(zip.files)
    .filter((n) => /ppt\/slides\/slide\d+\.xml$/i.test(n))
    .sort();
  const parts: string[] = [];
  for (const name of names) {
    const xml = await zip.files[name].async("string");
    const texts = [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)].map((x) => x[1]);
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
    const text = extractPdfText(await file.arrayBuffer());
    if (text.length < 40) {
      throw new Error(
        "This PDF looks scanned or image-based. Paste the text, or export a text PDF.",
      );
    }
    return text;
  }
  if (name.endsWith(".html") || name.endsWith(".htm")) {
    return stripTags(await file.text());
  }
  if (name.endsWith(".doc")) {
    throw new Error("Legacy .doc is not supported. Please save as .docx or paste the text.");
  }
  return (await file.text()).trim();
}
