import "./style.css";
import DEFAULT_TEXT from "./defaultText";
import {
  parseReferences,
  renderMarkedHtml,
  type RefMatch
} from "./parser";
import { fetchVerseText } from "./api";

type FetchedCache = Record<string, string | null | undefined>;

const inputEl = document.getElementById("inputText") as HTMLTextAreaElement;
const previewEl = document.getElementById("markedPreview") as HTMLDivElement;
const refsListEl = document.getElementById("refsList") as HTMLUListElement;
const refCountEl = document.getElementById("refCount") as HTMLSpanElement;
const themeButton = document.getElementById("themeButton") as HTMLButtonElement;
const themeButtonText = document.getElementById("themeButtonText") as HTMLSpanElement;
const themeDropdown = document.getElementById("themeDropdown") as HTMLDivElement;
const themeChevron = document.getElementById("themeChevron") as HTMLElement;
const recentsToggle = document.getElementById("recentsToggle") as HTMLButtonElement;
const recentsPanel = document.getElementById("recentsPanel") as HTMLDivElement;
const recentsList = document.getElementById("recentsList") as HTMLUListElement;

let inputText = DEFAULT_TEXT;
let version = "web"; // "web" or "kjv"
let activeId: string | null = null;
let fetched: FetchedCache = {};
let matches: RefMatch[] = [];
let recentTexts: string[] = [];
let recentsVisible = false;

function applyTheme(theme: string) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

function getInitialTheme(): string {
  const saved = localStorage.getItem("theme");
  if (saved && ["light", "light-high-contrast", "light-soft", "dark", "dark-soft", "dark-high-contrast"].includes(saved)) {
    return saved;
  }
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

// Recent texts management
function loadRecentTexts(): string[] {
  try {
    const saved = localStorage.getItem("recentTexts");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveRecentTexts(texts: string[]) {
  localStorage.setItem("recentTexts", JSON.stringify(texts));
}

function addToRecents(text: string) {
  // Only add if text is meaningful (not empty, not just whitespace)
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 10) return;
  
  // Remove if already exists (to move to top)
  recentTexts = recentTexts.filter(t => t !== trimmed);
  
  // Add to beginning
  recentTexts.unshift(trimmed);
  
  // Keep only last 20
  recentTexts = recentTexts.slice(0, 20);
  
  // Save to localStorage
  saveRecentTexts(recentTexts);
  renderRecents();
}

function toggleRecents() {
  recentsVisible = !recentsVisible;
  recentsPanel.classList.toggle("hidden", !recentsVisible);
  recentsToggle.textContent = recentsVisible ? "Recent Texts ▲" : "Recent Texts ▼";
}

function renderRecents() {
  if (recentTexts.length === 0) {
    recentsList.innerHTML = `<li class="p-2 text-xs text-gray-500">No recent texts yet.</li>`;
    return;
  }
  
  const rows = recentTexts.map((text, index) => {
    const preview = text.length > 80 ? text.substring(0, 80) + "..." : text;
    const refCount = parseReferences(text).length;
    return `
      <li data-index="${index}" class="p-2 cursor-pointer hover:bg-gray-50 border-l-2 border-transparent hover:border-blue-500">
        <div class="text-xs text-gray-700 leading-relaxed">${escapeForHtml(preview)}</div>
        <div class="text-xs text-gray-500 mt-1">${refCount} reference${refCount !== 1 ? 's' : ''}</div>
      </li>`;
  }).join("");
  
  recentsList.innerHTML = rows;
}

function loadRecentText(index: number) {
  if (index < 0 || index >= recentTexts.length) return;
  
  const text = recentTexts[index];
  
  // Archive current text if it's different and meaningful
  const currentTrimmed = inputText.trim();
  if (currentTrimmed && currentTrimmed !== text && currentTrimmed.length >= 10) {
    addToRecents(currentTrimmed);
  }
  
  // Load the selected text
  inputEl.value = text;
  setInput(text);
  
  // Move selected text to top of recents (without adding duplicate)
  recentTexts.splice(index, 1);
  recentTexts.unshift(text);
  saveRecentTexts(recentTexts);
  renderRecents();
  
  // Hide recents panel
  toggleRecents();
}


function recompute() {
  matches = parseReferences(inputText);
  refCountEl.textContent = `(${matches.length})`;
  renderPreview();
  renderRefList();
}

function renderPreview() {
  const html = renderMarkedHtml(inputText, matches);
  previewEl.innerHTML = html;

  // Apply active highlight if present
  if (activeId) {
    const node = document.getElementById(`ref-${activeId}`);
    node?.classList.add("active");
  }
}

function renderRefList() {
  const rows = matches.map((m) => {
    const isActive = m.id === activeId;
    const cache = fetched[m.id];
    const detail =
      isActive
        ? cache === undefined
          ? `<div class="mt-2 text-sm text-gray-500">Fetching verse text…</div>`
          : cache === null
          ? `<div class="mt-2 text-sm italic text-gray-500">No verse text available from demo API.</div>`
          : `<div class="mt-2 text-sm whitespace-pre-wrap leading-relaxed">${escapeForHtml(cache)}</div>`
        : "";
    
    return `
      <li data-id="${m.id}" class="p-3 cursor-pointer ${isActive ? "bg-blue-50 dark:bg-blue-950/30" : "hover:bg-gray-50 dark:hover:bg-gray-800/60"}">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="font-medium">${escapeForHtml(m.display)}</div>
            <div class="text-xs text-gray-500">${m.parts.map(p => p.start===p.end? `${p.start}` : `${p.start}-${p.end}`).join(", ")}</div>
          </div>
          <a class="text-xs underline text-blue-700"
             href="https://www.biblegateway.com/passage/?search=${encodeURIComponent(m.display)}"
             target="_blank" rel="noreferrer"
             title="Open on BibleGateway">Open</a>
        </div>
        ${detail}
      </li>`;
  }).join("");

  refsListEl.innerHTML = rows || `<li class="p-3 text-sm text-gray-500">No references detected yet.</li>`;
}

function escapeForHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Event: paste plain text (strip rich formatting)
inputEl.addEventListener("paste", (e: ClipboardEvent) => {
  e.preventDefault();
  const text = e.clipboardData?.getData("text/plain") ?? "";
  const start = inputEl.selectionStart ?? inputEl.value.length;
  const end = inputEl.selectionEnd ?? inputEl.value.length;
  inputEl.setRangeText(text, start, end, "end");
  setInput(inputEl.value);
});

// Event: input
inputEl.addEventListener("input", () => {
  setInput(inputEl.value);
});

// Event: click delegation in preview
previewEl.addEventListener("click", (e) => {
  const target = e.target as HTMLElement | null;
  const refId = target?.getAttribute?.("data-refid");
  if (!refId) return;
  setActive(refId);
});

// Event: click delegation in list
refsListEl.addEventListener("click", (e) => {
  const li = (e.target as HTMLElement).closest("li[data-id]") as HTMLLIElement | null;
  if (!li) return;
  const refId = li.getAttribute("data-id");
  if (!refId) return;
  setActive(refId);
});

// Theme dropdown functionality
let themeDropdownVisible = false;

function getThemeDisplayName(theme: string): string {
  const names: Record<string, string> = {
    "light": "Light",
    "light-high-contrast": "Light High Contrast",
    "light-soft": "Light Soft",
    "dark": "Dark",
    "dark-soft": "Dark Soft",
    "dark-high-contrast": "Dark High Contrast"
  };
  return names[theme] || theme;
}

function toggleThemeDropdown() {
  themeDropdownVisible = !themeDropdownVisible;
  themeDropdown.classList.toggle("hidden", !themeDropdownVisible);
  themeChevron.style.transform = themeDropdownVisible ? "rotate(180deg)" : "rotate(0deg)";
}

function selectTheme(theme: string) {
  applyTheme(theme);
  themeButtonText.textContent = getThemeDisplayName(theme);
  toggleThemeDropdown();
}

// Theme button click
themeButton.addEventListener("click", toggleThemeDropdown);

// Theme dropdown selection
themeDropdown.addEventListener("click", (e) => {
  const button = (e.target as HTMLElement).closest("button[data-theme]") as HTMLButtonElement | null;
  if (!button) return;
  const theme = button.getAttribute("data-theme");
  if (theme) {
    selectTheme(theme);
  }
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!themeButton.contains(e.target as Node) && !themeDropdown.contains(e.target as Node)) {
    if (themeDropdownVisible) {
      toggleThemeDropdown();
    }
  }
});

// Recent texts toggle
recentsToggle.addEventListener("click", toggleRecents);

// Recent texts selection
recentsList.addEventListener("click", (e) => {
  const li = (e.target as HTMLElement).closest("li[data-index]") as HTMLLIElement | null;
  if (!li) return;
  const index = parseInt(li.getAttribute("data-index") || "-1", 10);
  if (index >= 0) {
    loadRecentText(index);
  }
});

// Archive text when user makes significant changes
let archiveTimeout: number | null = null;
function scheduleArchive() {
  if (archiveTimeout) clearTimeout(archiveTimeout);
  archiveTimeout = window.setTimeout(() => {
    const trimmed = inputText.trim();
    if (trimmed && trimmed.length >= 10) {
      addToRecents(trimmed);
    }
  }, 3000); // Archive after 3 seconds of no changes
}

function setInput(text: string, skipArchive = false) {
  inputText = text;
  recompute();
  
  if (!skipArchive) {
    scheduleArchive();
  }
}

function setActive(refId: string) {
  activeId = refId;
  document.getElementById(`ref-${refId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  ensureFetchActive();
  renderPreview();
  renderRefList();
}

function ensureFetchActive() {
  if (!activeId) return;
  if (fetched[activeId] !== undefined) return;
  const ref = matches.find((m) => m.id === activeId);
  if (!ref) return;
  fetched[activeId] = undefined;
  renderRefList();
  fetchVerseText(ref, version).then((t) => {
    fetched[activeId!] = t;
    renderRefList();
  });
}

// Initial load
const initialTheme = getInitialTheme();
applyTheme(initialTheme);
themeButtonText.textContent = getThemeDisplayName(initialTheme);
recentTexts = loadRecentTexts();
renderRecents();
inputEl.value = inputText;
recompute();
