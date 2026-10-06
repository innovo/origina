/** SHA-256 of an API key, hex encoded. Only the hash is stored. */
export async function hashApiKey(raw: string): Promise<string> {
  const bytes = new TextEncoder().encode(raw.trim());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
