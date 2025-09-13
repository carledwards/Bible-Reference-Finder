import { validateReference } from "./bibleStructure";

export type RefMatch = {
  id: string;
  book: string;
  chapter: number;
  rawVerses: string;
  parts: Array<{ start: number; end: number }>;
  index: number;
  length: number;
  display: string;
  isValid: boolean;
  validationErrors: string[];
};

export const BOOK_ALIASES: Record<string, string> = {
  // Old Testament
  "gen": "Genesis", "ge": "Genesis", "gn": "Genesis", "genesis": "Genesis",
  "ex": "Exodus", "exo": "Exodus", "exodus": "Exodus",
  "lev": "Leviticus", "lv": "Leviticus", "leviticus": "Leviticus",
  "num": "Numbers", "nm": "Numbers", "nu": "Numbers", "numbers": "Numbers",
  "deut": "Deuteronomy", "dt": "Deuteronomy", "de": "Deuteronomy", "deuteronomy": "Deuteronomy",
  "jos": "Joshua", "josh": "Joshua", "joshua": "Joshua",
  "judg": "Judges", "jg": "Judges", "jdg": "Judges", "judges": "Judges",
  "rut": "Ruth", "ru": "Ruth", "ruth": "Ruth",
  "1sa": "1 Samuel", "1 sam": "1 Samuel", "1sam": "1 Samuel", "i sam": "1 Samuel", "1st sam": "1 Samuel", "first samuel": "1 Samuel",
  "2sa": "2 Samuel", "2 sam": "2 Samuel", "2sam": "2 Samuel", "ii sam": "2 Samuel", "2nd sam": "2 Samuel", "second samuel": "2 Samuel",
  "1ki": "1 Kings", "1 kgs": "1 Kings", "1kings": "1 Kings", "first kings": "1 Kings",
  "2ki": "2 Kings", "2 kgs": "2 Kings", "2kings": "2 Kings", "second kings": "2 Kings",
  "1ch": "1 Chronicles", "1 chron": "1 Chronicles", "1chronicles": "1 Chronicles", "first chronicles": "1 Chronicles",
  "2ch": "2 Chronicles", "2 chron": "2 Chronicles", "2chronicles": "2 Chronicles", "second chronicles": "2 Chronicles",
  "ezr": "Ezra", "ezra": "Ezra",
  "neh": "Nehemiah", "nehemiah": "Nehemiah",
  "est": "Esther", "esth": "Esther", "esther": "Esther",
  "job": "Job",
  "ps": "Psalms", "psa": "Psalms", "psalm": "Psalms", "psalms": "Psalms", "pss": "Psalms",
  "pr": "Proverbs", "prov": "Proverbs", "proverbs": "Proverbs",
  "ec": "Ecclesiastes", "ecc": "Ecclesiastes", "ecclesiastes": "Ecclesiastes",
  "song": "Song of Solomon", "so": "Song of Solomon", "song of songs": "Song of Solomon", "songs": "Song of Solomon", "ss": "Song of Solomon",
  "isa": "Isaiah", "is": "Isaiah", "isaiah": "Isaiah",
  "jer": "Jeremiah", "je": "Jeremiah", "jeremiah": "Jeremiah",
  "lam": "Lamentations", "lamentations": "Lamentations",
  "eze": "Ezekiel", "ezek": "Ezekiel", "ezekiel": "Ezekiel",
  "dan": "Daniel", "dn": "Daniel", "daniel": "Daniel",
  "hos": "Hosea", "hosea": "Hosea",
  "joe": "Joel", "jl": "Joel", "joel": "Joel",
  "amo": "Amos", "amos": "Amos",
  "oba": "Obadiah", "obadiah": "Obadiah",
  "jon": "Jonah", "jonah": "Jonah",
  "mic": "Micah", "micah": "Micah",
  "nah": "Nahum", "nahum": "Nahum",
  "hab": "Habakkuk", "habakkuk": "Habakkuk",
  "zep": "Zephaniah", "zeph": "Zephaniah", "zephaniah": "Zephaniah",
  "hag": "Haggai", "haggai": "Haggai",
  "zec": "Zechariah", "zech": "Zechariah", "zechariah": "Zechariah",
  "mal": "Malachi", "malachi": "Malachi",
  // New Testament
  "mat": "Matthew", "mt": "Matthew", "matt": "Matthew", "matthew": "Matthew",
  "mar": "Mark", "mk": "Mark", "mrk": "Mark", "mark": "Mark",
  "luk": "Luke", "lk": "Luke", "luke": "Luke",
  "joh": "John", "jn": "John", "john": "John",
  "act": "Acts", "acts": "Acts",
  "rom": "Romans", "ro": "Romans", "rm": "Romans", "romans": "Romans",
  "1co": "1 Corinthians", "1 cor": "1 Corinthians", "1cor": "1 Corinthians", "first corinthians": "1 Corinthians",
  "2co": "2 Corinthians", "2 cor": "2 Corinthians", "2cor": "2 Corinthians", "second corinthians": "2 Corinthians",
  "gal": "Galatians", "ga": "Galatians", "galatians": "Galatians",
  "eph": "Ephesians", "ephesians": "Ephesians",
  "php": "Philippians", "phil": "Philippians", "philippians": "Philippians",
  "col": "Colossians", "colossians": "Colossians",
  "1th": "1 Thessalonians", "1 thess": "1 Thessalonians", "1thessalonians": "1 Thessalonians",
  "2th": "2 Thessalonians", "2 thess": "2 Thessalonians", "2thessalonians": "2 Thessalonians",
  "1ti": "1 Timothy", "1 tim": "1 Timothy", "1tim": "1 Timothy",
  "2ti": "2 Timothy", "2 tim": "2 Timothy", "2tim": "2 Timothy",
  "tit": "Titus", "titus": "Titus",
  "phm": "Philemon", "philemon": "Philemon",
  "heb": "Hebrews", "hebrews": "Hebrews",
  "jas": "James", "jm": "James", "james": "James",
  "1pe": "1 Peter", "1pet": "1 Peter", "1 peter": "1 Peter",
  "2pe": "2 Peter", "2pet": "2 Peter", "2 peter": "2 Peter",
  "1jo": "1 John", "1 jn": "1 John", "1john": "1 John",
  "2jo": "2 John", "2 jn": "2 John", "2john": "2 John",
  "3jo": "3 John", "3 jn": "3 John", "3john": "3 John",
  "jud": "Jude", "jude": "Jude",
  "rev": "Revelation", "re": "Revelation", "rv": "Revelation", "apocalypse": "Revelation", "revelation": "Revelation"
};

// Build a regex alternation for book detection
const BOOK_ALT = (() => {
  const names = Object.keys(BOOK_ALIASES).sort((a, b) => b.length - a.length);
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return names.map(esc).join("|");
})();

// Example patterns like: "Jn 3:16-18", "1 Cor 13:4–7", "Genesis 1:1,3,5", "Matt. 15:18-20"
export const REF_REGEX = new RegExp(
  String.raw`(?:^|[\s(])(${BOOK_ALT})\.?\s+(\d{1,3})\s*:\s*([\d,-–]+?)(?=\s*[;.!?\s)]|$)`,
  "gi"
);

// Parse a "verses" spec like "4–7, 9-10,12" into ranges
export function parseVerseParts(spec: string): Array<{ start: number; end: number }> {
  return spec
    .trim()
    .split(/\s*,\s*/)
    .filter(Boolean)
    .flatMap((part) => {
      const m = part.trim().match(/^(\d+)(?:\s*[–-]\s*(\d+))?$/);
      if (!m) return [];
      const s = parseInt(m[1], 10);
      const e = m[2] ? parseInt(m[2], 10) : s;
      if (Number.isNaN(s) || Number.isNaN(e)) return [];
      return [{ start: Math.min(s, e), end: Math.max(s, e) }];
    });
}

export function canonicalizeBook(raw: string): string | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return BOOK_ALIASES[key] ?? null;
}

export function parseReferences(text: string): RefMatch[] {
  const matches: RefMatch[] = [];
  REF_REGEX.lastIndex = 0;
  let m: RegExpExecArray | null;
  let counter = 0;
  while ((m = REF_REGEX.exec(text)) !== null) {
    const rawBook = m[1];
    const book = canonicalizeBook(rawBook);
    if (!book) continue;
    const chapter = parseInt(m[2], 10);
    const verses = m[3];
    const parts = parseVerseParts(verses);
    const id = `${book.replace(/\s+/g, "")}-${chapter}-${counter++}`;
    const display = `${book} ${chapter}:${verses.replace(/\s+/g, "")}`;
    
    // Validate all verse ranges
    const validationErrors: string[] = [];
    let isValid = true;
    
    for (const part of parts) {
      for (let verse = part.start; verse <= part.end; verse++) {
        const validation = validateReference(book, chapter, verse);
        if (!validation.valid) {
          validationErrors.push(validation.error!);
          isValid = false;
        }
      }
    }
    
    // Skip invalid references entirely
    if (!isValid) {
      continue;
    }
    
    // Adjust index to account for the leading whitespace/parenthesis in the regex
    const fullMatch = m[0];
    const bookStartIndex = fullMatch.indexOf(rawBook);
    const adjustedIndex = m.index + bookStartIndex;
    const adjustedLength = fullMatch.length - bookStartIndex;
    
    matches.push({
      id,
      book,
      chapter,
      rawVerses: verses,
      parts,
      index: adjustedIndex,
      length: adjustedLength,
      display,
      isValid,
      validationErrors
    });
  }
  return matches;
}

// Replace matches in text with anchor-like spans that can be targeted
export function renderMarkedHtml(text: string, matches: RefMatch[]): string {
  if (matches.length === 0) return escapeHtml(text);
  const chunks: string[] = [];
  let cursor = 0;
  for (const ref of matches) {
    if (ref.index > cursor) {
      chunks.push(escapeHtml(text.slice(cursor, ref.index)));
    }
    const original = text.slice(ref.index, ref.index + ref.length);
    const cssClass = ref.isValid 
      ? "underline decoration-dotted text-blue-700 cursor-pointer"
      : "underline decoration-wavy text-red-600 cursor-pointer";
    const title = ref.isValid ? "" : ` title="${escapeHtml(ref.validationErrors.join('; '))}"`;
    chunks.push(
      `<span id="ref-${ref.id}" class="${cssClass}" data-refid="${ref.id}"${title}>${escapeHtml(original)}</span>`
    );
    cursor = ref.index + ref.length;
  }
  if (cursor < text.length) chunks.push(escapeHtml(text.slice(cursor)));
  return chunks.join("");
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
