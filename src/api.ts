import type { RefMatch } from "./parser";

// bible-api.com expects "John 3:16-18" and versions like KJV, WEB ("web")
export async function fetchVerseText(ref: RefMatch, version: string): Promise<string | null> {
  try {
    const spec = ref.parts
      .map((p) => (p.start === p.end ? `${p.start}` : `${p.start}-${p.end}`))
      .join(",");
    const q = `${ref.book} ${ref.chapter}:${spec}`;
    const url = `https://bible-api.com/${encodeURIComponent(q)}?translation=${encodeURIComponent(version)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.text) return String(data.text).trim();
    return null;
  } catch {
    return null;
  }
}
