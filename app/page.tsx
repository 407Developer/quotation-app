"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ManualQuoteForm from "@/components/ManualQuoteForm";
import { ManualFormState, STANDARD_ITEMS, QuoteData, QuoteItem } from "@/lib/types";
import { generatePdfClient } from "@/lib/clientPdf";
import { getHistory, addHistory, deleteHistory, clearHistory, HistoryEntry } from "@/lib/history";

const ICONS = {
  sparkle: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z",
  pencil: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
  download: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3",
  close: "M6 18L18 6M6 6l12 12",
  clock: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
  trash: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0",
};

function Icon({ path, className = "w-5 h-5" }: { path: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

function todayStr() { return new Date().toISOString().split("T")[0]; }

function defaultForm(): ManualFormState {
  const items: Record<string, { qty: number; rate: number }> = {};
  for (const s of STANDARD_ITEMS) items[s.key] = { qty: 0, rate: s.defaultRate };
  return { client_name: "", date: todayStr(), title: "Vinyl Flooring & Installation Quotation", items, customItems: [] };
}

function manualFormToQuoteData(form: ManualFormState): QuoteData {
  const items: QuoteItem[] = [];
  let mT = 0, aT = 0, wT = 0;
  const mD: string[] = [], aD: string[] = [], wD: string[] = [];
  for (const s of STANDARD_ITEMS) {
    const v = form.items[s.key];
    if (!v.qty) continue;
    const a = v.qty * v.rate;
    items.push({ description: s.label, qty: v.qty, unit: s.unit, rate: v.rate, amount: a });
    const d = `${s.label} (${v.qty}${s.unit} × ₦${v.rate.toLocaleString()})`;
    if (s.category === "material") { mT += a; mD.push(d); } else if (s.category === "accessory") { aT += a; aD.push(d); } else { wT += a; wD.push(d); }
  }
  for (const c of form.customItems) {
    if (!c.qty || !c.rate) continue;
    const a = c.qty * c.rate;
    items.push({ ...c, amount: a });
    const d = `${c.description} (${c.qty} ${c.unit} × ₦${c.rate.toLocaleString()})`;
    if (c.description.toLowerCase().includes("vinyl")) { mT += a; mD.push(d); } else if (c.description.toLowerCase().includes("workmanship")) { wT += a; wD.push(d); } else { aT += a; aD.push(d); }
  }
  return {
    client_name: form.client_name, date: form.date || todayStr(), title: form.title,
    company: { name: "JOBON INTERNATIONAL LTD", subtitle: "FLOORING & INTERIOR SOLUTIONS", phone: "09165208580" },
    items,
    summary: { material_total: mT, material_sub: mD.join("; ") || "—", accessories_total: aT, accessories_sub: aD.join("; ") || "—", workmanship_total: wT, workmanship_sub: wD.join("; ") || "—", grand_total: mT + aT + wT },
  };
}

export default function Home() {
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [prompt, setPrompt] = useState("");
  const [manualForm, setManualForm] = useState<ManualFormState>(defaultForm());
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => { setHistory(getHistory()); }, []);

  function refreshHistory() { setHistory([...getHistory()]); }

  const generatePdf = useCallback(async (data: QuoteData) => {
    setLoading(true); setError(null); setPdfUrl(null); setShowPreview(true);
    try {
      setPdfUrl(URL.createObjectURL(await generatePdfClient(data)));
      addHistory(data);
      refreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally { setLoading(false); }
  }, []);

  async function handleAiGenerate() {
    if (!prompt.trim()) return;
    setLoading(true); setError(null); setPdfUrl(null); setShowPreview(true);
    try {
      const res = await fetch("/api/parse-quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to parse");
      const data: QuoteData = await res.json();
      const form = defaultForm();
      form.client_name = data.client_name; form.date = data.date; form.title = data.title;
      for (const item of data.items) {
        const std = STANDARD_ITEMS.find((s) => s.label.toLowerCase() === item.description.toLowerCase());
        if (std) form.items[std.key] = { qty: item.qty, rate: item.rate };
        else form.customItems.push({ ...item });
      }
      setManualForm(form);
      await generatePdf(data);
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); } finally { setLoading(false); }
  }

  function handleManualGenerate() { generatePdf(manualFormToQuoteData(manualForm)); }

  async function handleHistoryClick(entry: HistoryEntry) {
    setLoading(true); setError(null); setPdfUrl(null); setShowPreview(true); setShowHistory(false);
    try {
      setPdfUrl(URL.createObjectURL(await generatePdfClient(entry.quoteData)));
      const form = defaultForm();
      form.client_name = entry.quoteData.client_name; form.date = entry.quoteData.date; form.title = entry.quoteData.title;
      for (const item of entry.quoteData.items) {
        const std = STANDARD_ITEMS.find((s) => s.label.toLowerCase() === item.description.toLowerCase());
        if (std) form.items[std.key] = { qty: item.qty, rate: item.rate };
        else form.customItems.push({ ...item });
      }
      setManualForm(form);
      setMode("manual");
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#f2f0ed]">
      <header className="bg-[#1a2e40] text-white px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#b89047] flex items-center justify-center text-[#1a2e40] font-black text-lg sm:text-xl tracking-tight">
              J
            </div>
            <div className="leading-tight">
              <h1 className="text-sm sm:text-base font-bold tracking-wide">JOBON INTERNATIONAL LTD</h1>
              <p className="text-[10px] sm:text-[11px] text-[#b89047] tracking-[0.2em] uppercase font-medium">Quotation Generator</p>
            </div>
          </div>
          <button onClick={() => { setShowHistory(!showHistory); refreshHistory(); }} className="text-white/60 hover:text-white transition-colors p-1.5">
            <Icon path={ICONS.clock} className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 pt-3 sm:pt-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-1 shadow-sm border border-gray-200/80 inline-flex w-full sm:w-auto">
          {([["ai", "AI Prompt", ICONS.sparkle], ["manual", "Manual Form", ICONS.pencil]] as const).map(([val, label, icon]) => (
            <button key={val} onClick={() => setMode(val)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${mode === val ? "bg-[#1a2e40] text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >
              <Icon path={icon} className="w-4 h-4 sm:w-5 sm:h-5" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 bg-black/30 backdrop-blur-sm" onClick={() => setShowHistory(false)}>
          <div className="w-full max-w-lg mx-3 bg-white rounded-2xl shadow-xl border border-gray-200 max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Quote History</h2>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button onClick={() => { clearHistory(); refreshHistory(); }} className="text-[11px] text-red-400 hover:text-red-600 font-medium transition-colors">Clear All</button>
                )}
                <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600 p-0.5"><Icon path={ICONS.close} className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {history.length === 0 ? (
                <p className="text-center text-sm text-gray-300 py-10 italic">No quotes yet. Generate one to see it here.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {history.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => handleHistoryClick(entry)}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{entry.client_name}</div>
                        <div className="text-[11px] text-gray-400">{new Date(entry.created_at).toLocaleDateString()} · ₦{entry.grand_total.toLocaleString()}</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteHistory(entry.id); refreshHistory(); }} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1">
                        <Icon path={ICONS.trash} className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 max-w-7xl mx-auto w-full">
        <div className="flex-1 flex flex-col gap-3">
          {mode === "ai" ? (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-sm flex-1 flex flex-col">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Raw Input</label>
              <textarea className="flex-1 w-full border border-gray-200 rounded-xl p-3.5 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[#b89047]/40 focus:border-[#b89047] min-h-[180px] sm:min-h-[280px] transition-all bg-gray-50/50"
                placeholder={`Paste notes here...\n\ne.g. make a quotation for Mr Andrew\nvinyl: 52sqm * 9,000\nskirting: 40m * 2,500`}
                value={prompt} onChange={(e) => setPrompt(e.target.value)}
              />
              <button onClick={handleAiGenerate} disabled={loading || !prompt.trim()}
                className="mt-3 bg-[#1a2e40] hover:bg-[#253d52] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 sm:py-3.5 px-5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
              >
                {loading ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <Icon path={ICONS.download} className="w-4 h-4" />}
                {loading ? "Generating..." : "Generate PDF Quote"}
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <ManualQuoteForm form={manualForm} onChange={setManualForm} />
              <button onClick={handleManualGenerate} disabled={loading || !manualForm.client_name.trim()}
                className="mt-3 w-full bg-[#1a2e40] hover:bg-[#253d52] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 sm:py-3.5 px-5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
              >
                {loading ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <Icon path={ICONS.download} className="w-4 h-4" />}
                {loading ? "Generating..." : "Generate PDF Quote"}
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm text-red-600 border border-red-200/80 rounded-xl p-3.5 text-sm flex items-start gap-2.5">
              <Icon path={ICONS.close} className="w-4 h-4 mt-0.5 shrink-0" />{error}
            </div>
          )}
        </div>

        {showPreview && (
          <div className="sm:flex-1 bg-white rounded-2xl shadow-sm border border-gray-200/80 flex flex-col sm:min-h-[500px]">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-gray-100">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Preview</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowPreview(false)} className="sm:hidden text-xs text-gray-400 hover:text-gray-600">Hide</button>
                {pdfUrl && (
                  <a href={pdfUrl} download="quotation.pdf" className="text-xs font-medium text-[#b89047] hover:text-[#a07a30] flex items-center gap-1.5">
                    <Icon path={ICONS.download} className="w-3.5 h-3.5" /> Download
                  </a>
                )}
              </div>
            </div>
            <div className="flex-1 p-3 sm:p-4">
              {pdfUrl ? (
                <iframe ref={iframeRef} src={pdfUrl} className="w-full h-[400px] sm:h-full border border-gray-100 rounded-xl bg-white" title="PDF Preview" />
              ) : (
                <div className="flex items-center justify-center h-[200px] sm:h-full text-gray-400 text-sm">{loading ? "Generating..." : "Preview will appear here"}</div>
              )}
            </div>
          </div>
        )}

        {!showPreview && pdfUrl && (
          <button onClick={() => setShowPreview(true)} className="sm:hidden bg-white border border-gray-200 rounded-xl py-3 text-sm font-semibold text-[#1a2e40] shadow-sm">Show Preview</button>
        )}
      </main>
    </div>
  );
}
