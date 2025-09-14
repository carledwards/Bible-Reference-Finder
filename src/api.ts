import type { RefMatch } from "./parser";

/**
 * Fetch verse text from bible-api.com.
 * We prefer the structured `verses` array (which contains one entry per verse)
 * and format it ourselves so the count exactly matches the requested verses.
 * Falls back to `data.text` when `verses` is missing.
 */
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

    // Build the exact list of verse numbers requested
    const requested: number[] = [];
    for (const part of ref.parts) {
      for (let v = part.start; v <= part.end; v++) requested.push(v);
    }

    // Prefer the structured verses array to avoid any ambiguity
    if (Array.isArray(data?.verses) && data.verses.length > 0) {
      const wanted = new Set(requested);
      const segments = data.verses
        .filter((v: any) => wanted.has(Number(v.verse)))
        .map((v: any) => `${Number(v.verse)} ${String(v.text ?? "").trim()}`.replace(/\s+/g, " ").trim());
      const combined = segments.join(" ").trim();
      return combined || null;
    }

    // Fallback: format the plain text by adding verse numbers heuristically
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
  // Collect all verse numbers from the parts
  const allVerses: number[] = [];
  for (const part of ref.parts) {
    for (let v = part.start; v <= part.end; v++) {
      allVerses.push(v);
    }
  }
  
  // If it's a single verse, just add the verse number at the beginning
  if (allVerses.length === 1) {
    return `${allVerses[0]} ${text}`;
  }
  
  // For multiple verses, we'll use a simple approach:
  // Split the text into roughly equal parts and assign verse numbers
  const words = text.split(/\s+/);
  const wordsPerVerse = Math.ceil(words.length / allVerses.length);
  
  const result: string[] = [];
  let wordIndex = 0;
  
  for (let i = 0; i < allVerses.length; i++) {
    const verseWords: string[] = [];
    const wordsToTake = i === allVerses.length - 1 
      ? words.length - wordIndex  // Take all remaining words for the last verse
      : wordsPerVerse;
    
    for (let j = 0; j < wordsToTake && wordIndex < words.length; j++) {
      verseWords.push(words[wordIndex]);
      wordIndex++;
    }
    
    if (verseWords.length > 0) {
      result.push(`${allVerses[i]} ${verseWords.join(' ')}`);
    }
  }
  
  return result.join(' ');
}
