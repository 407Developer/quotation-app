"use client";

import { useState, useRef, useCallback } from "react";
import ManualQuoteForm from "@/components/ManualQuoteForm";
import { ManualFormState, STANDARD_ITEMS, QuoteData, QuoteItem } from "@/lib/types";
import { generatePdfClient } from "@/lib/clientPdf";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function defaultForm(): ManualFormState {
  const items: Record<string, { qty: number; rate: number }> = {};
  for (const s of STANDARD_ITEMS) {
    items[s.key] = { qty: 0, rate: s.defaultRate };
  }
  return {
    client_name: "",
    date: todayStr(),
    title: "Vinyl Flooring & Installation Quotation",
    items,
    customItems: [],
  };
}

function manualFormToQuoteData(form: ManualFormState): QuoteData {
  const items: QuoteItem[] = [];
  let materialTotal = 0;
  let accessoriesTotal = 0;
  let workmanshipTotal = 0;
  const materialDescs: string[] = [];
  const accessoryDescs: string[] = [];
  const workmanshipDescs: string[] = [];

  for (const s of STANDARD_ITEMS) {
    const v = form.items[s.key];
    if (!v.qty) continue;
    const amount = v.qty * v.rate;
    items.push({ description: s.label, qty: v.qty, unit: s.unit, rate: v.rate, amount });

    if (s.category === "material") {
      materialTotal += amount;
      materialDescs.push(`${s.label} (${v.qty}${s.unit} × ₦${v.rate.toLocaleString()})`);
    } else if (s.category === "accessory") {
      accessoriesTotal += amount;
      accessoryDescs.push(`${s.label} (${v.qty} ${s.unit} × ₦${v.rate.toLocaleString()})`);
    } else {
      workmanshipTotal += amount;
      workmanshipDescs.push(`${s.label} (${v.qty}${s.unit} × ₦${v.rate.toLocaleString()})`);
    }
  }

  for (const c of form.customItems) {
    if (!c.qty || !c.rate) continue;
    const amount = c.qty * c.rate;
    items.push({ ...c, amount });
    const desc = `${c.description} (${c.qty} ${c.unit} × ₦${c.rate.toLocaleString()})`;
    if (c.description.toLowerCase().includes("vinyl")) {
      materialTotal += amount;
      materialDescs.push(desc);
    } else if (c.description.toLowerCase().includes("workmanship")) {
      workmanshipTotal += amount;
      workmanshipDescs.push(desc);
    } else {
      accessoriesTotal += amount;
      accessoryDescs.push(desc);
    }
  }

  return {
    client_name: form.client_name,
    date: form.date || todayStr(),
    title: form.title,
    company: {
      name: "JOBON INTERNATIONAL LTD",
      subtitle: "FLOORING & INTERIOR SOLUTIONS",
      phone: "09165208580",
    },
    items,
    summary: {
      material_total: materialTotal,
      material_sub: materialDescs.join("; ") || "—",
      accessories_total: accessoriesTotal,
      accessories_sub: accessoryDescs.join("; ") || "—",
      workmanship_total: workmanshipTotal,
      workmanship_sub: workmanshipDescs.join("; ") || "—",
      grand_total: materialTotal + accessoriesTotal + workmanshipTotal,
    },
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const generatePdf = useCallback(async (data: QuoteData) => {
    setLoading(true);
    setError(null);
    setPdfUrl(null);
    setShowPreview(true);
    try {
      const blob = await generatePdfClient(data);
      setPdfUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleAiGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setPdfUrl(null);
    setShowPreview(true);
    try {
      const res = await fetch("/api/parse-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to parse quotation");
      }
      const data: QuoteData = await res.json();

      const form = defaultForm();
      form.client_name = data.client_name;
      form.date = data.date;
      form.title = data.title;
      for (const item of data.items) {
        const std = STANDARD_ITEMS.find(
          (s) => s.label.toLowerCase() === item.description.toLowerCase()
        );
        if (std) {
          form.items[std.key] = { qty: item.qty, rate: item.rate };
        } else {
          form.customItems.push({ ...item });
        }
      }
      setManualForm(form);

      await generatePdf(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleManualGenerate() {
    generatePdf(manualFormToQuoteData(manualForm));
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3f0]">
      <header className="bg-[#1a2e40] text-white px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
        <h1 className="text-base sm:text-xl font-bold tracking-wide">
          JOBON INTERNATIONAL LTD
        </h1>
        <p className="text-[#b89047] text-[11px] sm:text-sm tracking-widest uppercase">
          Quotation Generator
        </p>
      </header>

      <div className="flex bg-white border-b border-gray-200">
        <button
          onClick={() => setMode("ai")}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold tracking-wide uppercase transition-colors ${
            mode === "ai"
              ? "text-[#1a2e40] border-b-2 border-[#b89047]"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          AI Prompt
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold tracking-wide uppercase transition-colors ${
            mode === "manual"
              ? "text-[#1a2e40] border-b-2 border-[#b89047]"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Manual Form
        </button>
      </div>

      <main className="flex-1 flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 max-w-7xl mx-auto w-full">
        <div className="flex-1 flex flex-col gap-3">
          {mode === "ai" ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex-1 flex flex-col">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Raw Quotation Input
              </label>
              <textarea
                className="flex-1 w-full border border-gray-300 rounded-xl p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[#b89047] focus:border-transparent min-h-[200px] sm:min-h-[300px] transition-shadow"
                placeholder={`Paste quotation notes here...\n\ne.g.: make a quotation for Mr Andrew\nvinyl: 52sqm * 9,000\nskirting: 40m * 2,500`}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button
                onClick={handleAiGenerate}
                disabled={loading || !prompt.trim()}
                className="mt-3 bg-[#1a2e40] hover:bg-[#253d52] disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold py-3 sm:py-3.5 px-6 rounded-xl transition-colors tracking-wide uppercase text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  "Generate PDF Quote"
                )}
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <ManualQuoteForm form={manualForm} onChange={setManualForm} />
              <button
                onClick={handleManualGenerate}
                disabled={loading || !manualForm.client_name.trim()}
                className="mt-3 w-full bg-[#1a2e40] hover:bg-[#253d52] disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold py-3 sm:py-3.5 px-6 rounded-xl transition-colors tracking-wide uppercase text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  "Generate PDF Quote"
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}
        </div>

        {showPreview && (
          <div className="sm:flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:min-h-[500px]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                PDF Preview
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="sm:hidden text-xs text-gray-400 hover:text-gray-600"
                >
                  Hide
                </button>
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    download={`quotation.pdf`}
                    className="text-xs text-[#b89047] hover:text-[#a07a30] font-medium"
                  >
                    Download
                  </a>
                )}
              </div>
            </div>
            <div className="flex-1 p-3 sm:p-4">
              {pdfUrl ? (
                <iframe
                  ref={iframeRef}
                  src={pdfUrl}
                  className="w-full h-[400px] sm:h-full border border-gray-100 rounded-xl"
                  title="PDF Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-[200px] sm:h-full text-gray-400 text-sm">
                  {loading ? "Generating PDF..." : "Your PDF preview will appear here"}
                </div>
              )}
            </div>
          </div>
        )}

        {!showPreview && pdfUrl && (
          <button
            onClick={() => setShowPreview(true)}
            className="sm:hidden bg-white border border-gray-200 rounded-xl py-3 text-sm font-semibold text-[#1a2e40] shadow-sm"
          >
            Show PDF Preview
          </button>
        )}
      </main>
    </div>
  );
}
