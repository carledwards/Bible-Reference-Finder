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
    if (data?.text) {
      const text = String(data.text).trim();
      return addVerseNumbers(text, ref);
    }
    return null;
  } catch {
    return null;
  }
}

// Add verse numbers to the text based on the reference parts
function addVerseNumbers(text: string, ref: RefMatch): string {
  // If it's a single verse, just add the verse number at the beginning
  if (ref.parts.length === 1 && ref.parts[0].start === ref.parts[0].end) {
    return `${ref.parts[0].start} ${text}`;
  }
  
  // For multiple verses, we need to try to split the text intelligently
  // This is a best-effort approach since bible-api.com doesn't provide verse boundaries
  const sentences = text.split(/(?<=[.!?])\s+/);
  const allVerses: number[] = [];
  
  // Collect all verse numbers from the parts
  for (const part of ref.parts) {
    for (let v = part.start; v <= part.end; v++) {
      allVerses.push(v);
    }
  }
  
  // If we have the same number of sentences as verses, map them 1:1
  if (sentences.length === allVerses.length) {
    return sentences.map((sentence, i) => `${allVerses[i]} ${sentence}`).join(' ');
  }
  
  // Otherwise, just add the verse range at the beginning
  const verseRange = ref.parts
    .map(p => p.start === p.end ? `${p.start}` : `${p.start}-${p.end}`)
    .join(',');
  return `${verseRange} ${text}`;
}
