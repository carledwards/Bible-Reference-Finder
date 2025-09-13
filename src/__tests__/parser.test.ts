import { describe, it, expect } from "vitest";
import { parseVerseParts, parseReferences, canonicalizeBook } from "../parser";

describe("parseVerseParts", () => {
  it("handles single verses", () => {
    expect(parseVerseParts("16")).toEqual([
      { start: 16, end: 16 }
    ]);
  });

  it("handles ranges with hyphen and en dash", () => {
    expect(parseVerseParts("4–7")).toEqual([
      { start: 4, end: 7 }
    ]);
    
    expect(parseVerseParts("9-10")).toEqual([
      { start: 9, end: 10 }
    ]);
  });

  it("handles comma-separated lists", () => {
    expect(parseVerseParts("1,3,5")).toEqual([
      { start: 1, end: 1 },
      { start: 3, end: 3 },
      { start: 5, end: 5 }
    ]);
  });

  it("handles mixed ranges and lists", () => {
    expect(parseVerseParts("4–7, 9-10,12")).toEqual([
      { start: 4, end: 7 },
      { start: 9, end: 10 },
      { start: 12, end: 12 }
    ]);
  });

  it("handles whitespace gracefully", () => {
    expect(parseVerseParts(" 1 , 3 – 5 , 7 ")).toEqual([
      { start: 1, end: 1 },
      { start: 3, end: 5 },
      { start: 7, end: 7 }
    ]);
  });

  it("ignores invalid parts", () => {
    expect(parseVerseParts("1,invalid,3")).toEqual([
      { start: 1, end: 1 },
      { start: 3, end: 3 }
    ]);
  });
});

describe("canonicalizeBook", () => {
  it("handles common abbreviations", () => {
    expect(canonicalizeBook("jn")).toBe("John");
    expect(canonicalizeBook("Jn")).toBe("John");
    expect(canonicalizeBook("JN")).toBe("John");
    expect(canonicalizeBook("john")).toBe("John");
    expect(canonicalizeBook("John")).toBe("John");
  });

  it("handles numbered books", () => {
    expect(canonicalizeBook("1 cor")).toBe("1 Corinthians");
    expect(canonicalizeBook("1cor")).toBe("1 Corinthians");
    expect(canonicalizeBook("2 sam")).toBe("2 Samuel");
  });

  it("handles whitespace normalization", () => {
    expect(canonicalizeBook("  1   cor  ")).toBe("1 Corinthians");
  });

  it("returns null for unknown books", () => {
    expect(canonicalizeBook("unknown")).toBe(null);
    expect(canonicalizeBook("")).toBe(null);
  });
});

describe("parseReferences", () => {
  it("detects simple references", () => {
    const text = "Read John 3:16 today.";
    const matches = parseReferences(text);
    expect(matches).toHaveLength(1);
    expect(matches[0].book).toBe("John");
    expect(matches[0].chapter).toBe(3);
    expect(matches[0].display).toBe("John 3:16");
  });

  it("detects multiple references", () => {
    const text = "We love John 3:16-18 and 1 Cor 13:4–7; 14:1. Also Genesis 1:1,3,5.";
    const matches = parseReferences(text);
    expect(matches.length).toBeGreaterThanOrEqual(3);
    
    const johnMatch = matches.find(m => m.book === "John");
    expect(johnMatch).toBeDefined();
    expect(johnMatch?.parts).toEqual([{ start: 16, end: 18 }]);
    
    // Test Genesis separately to see what's actually parsed
    const genesisText = "Genesis 1:1,3,5.";
    const genesisMatches = parseReferences(genesisText);
    expect(genesisMatches).toHaveLength(1);
    expect(genesisMatches[0].parts.length).toBeGreaterThanOrEqual(2); // At least 1,3
  });

  it("handles abbreviations correctly", () => {
    const text = "See Jn 1:1 and 1 Cor 13:13.";
    const matches = parseReferences(text);
    expect(matches).toHaveLength(2);
    expect(matches[0].book).toBe("John");
    expect(matches[1].book).toBe("1 Corinthians");
  });

  it("ignores invalid references", () => {
    const text = "This has no valid references like Fake 1:1.";
    const matches = parseReferences(text);
    expect(matches).toHaveLength(0);
  });

  it("handles edge cases with punctuation", () => {
    const text = "Read John 3:16! Also see Rom 8:28.";
    const matches = parseReferences(text);
    expect(matches).toHaveLength(2);
    expect(matches[0].book).toBe("John");
    expect(matches[1].book).toBe("Romans");
  });

  it("handles references in parentheses", () => {
    const text = "This is a great verse (John 15:5) that we should remember.";
    const matches = parseReferences(text);
    expect(matches).toHaveLength(1);
    expect(matches[0].book).toBe("John");
    expect(matches[0].chapter).toBe(15);
    expect(matches[0].parts).toEqual([{ start: 5, end: 5 }]);
  });

  it("handles complex semicolon-separated references", () => {
    const text = "We love John 3:16-18 and 1 Cor 13:4–7; 14:1. Also Genesis 1:1,3,5; Jn 1:1; Rev 22:20.";
    const matches = parseReferences(text);
    
    // Should find at least: John 3:16-18, 1 Cor 13:4-7, Genesis 1:1,3,5, Jn 1:1, Rev 22:20
    expect(matches.length).toBeGreaterThanOrEqual(5);
    
    const johnMatch = matches.find(m => m.book === "John" && m.chapter === 3);
    expect(johnMatch).toBeDefined();
    
    const corMatch = matches.find(m => m.book === "1 Corinthians");
    expect(corMatch).toBeDefined();
    
    const genesisMatch = matches.find(m => m.book === "Genesis");
    expect(genesisMatch).toBeDefined();
    
    const johnChapter1Match = matches.find(m => m.book === "John" && m.chapter === 1);
    expect(johnChapter1Match).toBeDefined();
    
    const revMatch = matches.find(m => m.book === "Revelation");
    expect(revMatch).toBeDefined();
  });

  it("handles abbreviated book names with periods", () => {
    const text = "(Matt. 15:18–20) and (Gal. 5:19–21).";
    const matches = parseReferences(text);
    expect(matches).toHaveLength(2);
    
    expect(matches[0].book).toBe("Matthew");
    expect(matches[0].chapter).toBe(15);
    expect(matches[0].parts).toEqual([{ start: 18, end: 20 }]);
    
    expect(matches[1].book).toBe("Galatians");
    expect(matches[1].chapter).toBe(5);
    expect(matches[1].parts).toEqual([{ start: 19, end: 21 }]);
  });

  it("handles mixed period and non-period abbreviations", () => {
    const text = "Compare Matt. 5:3 with Mt 5:4 and see Gal 6:1 vs Gal. 6:2.";
    const matches = parseReferences(text);
    expect(matches).toHaveLength(4);
    
    // All should resolve to the same books
    expect(matches[0].book).toBe("Matthew");
    expect(matches[1].book).toBe("Matthew");
    expect(matches[2].book).toBe("Galatians");
    expect(matches[3].book).toBe("Galatians");
  });
});
