import { QuoteData } from "./types";

export interface HistoryEntry {
  id: string;
  client_name: string;
  date: string;
  grand_total: number;
  created_at: string;
  quoteData: QuoteData;
}

const STORAGE_KEY = "jobon_quote_history";

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addHistory(quoteData: QuoteData): HistoryEntry {
  const history = getHistory();
  const entry: HistoryEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    client_name: quoteData.client_name,
    date: quoteData.date,
    grand_total: quoteData.summary.grand_total,
    created_at: new Date().toISOString(),
    quoteData,
  };
  history.unshift(entry);
  // Keep last 50 entries
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
  return entry;
}

export function deleteHistory(id: string): void {
  const history = getHistory().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
