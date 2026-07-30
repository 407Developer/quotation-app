"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  async function handleGenerate() {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setPdfUrl(null);

    try {
      const parseRes = await fetch("/api/parse-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!parseRes.ok) {
        const err = await parseRes.json();
        throw new Error(err.error || "Failed to parse quotation");
      }

      const quoteData = await parseRes.json();

      const pdfRes = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteData),
      });

      if (!pdfRes.ok) {
        const err = await pdfRes.json();
        throw new Error(err.error || "Failed to generate PDF");
      }

      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-[#1a2e40] text-white px-6 py-4 shadow-md">
        <h1 className="text-xl font-bold tracking-wide">
          JOBON INTERNATIONAL LTD
        </h1>
        <p className="text-[#b89047] text-sm tracking-widest uppercase">
          Quotation Generator
        </p>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-4 p-4">
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex-1 flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-2">
              Raw Quotation Input
            </label>
            <textarea
              className="flex-1 w-full border border-gray-300 rounded-md p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[#b89047] min-h-[300px]"
              placeholder={`Paste quotation notes here...\n\ne.g.: make a quotation for Mr Andrew\nvinyl: 52sqm * 9,000\nskirting: 40m * 2,500\nadhesive: 45,000\nlabour: 150,000`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="bg-[#1a2e40] hover:bg-[#253d52] disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors tracking-wide uppercase text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </span>
            ) : (
              "Generate PDF Quote"
            )}
          </button>

          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-md p-3 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-700">
              PDF Preview
            </span>
            {pdfUrl && (
              <a
                href={pdfUrl}
                download={`quotation.pdf`}
                className="text-sm text-[#b89047] hover:text-[#a07a30] font-medium underline"
              >
                Download PDF
              </a>
            )}
          </div>
          <div className="flex-1 p-4">
            {pdfUrl ? (
              <iframe
                ref={iframeRef}
                src={pdfUrl}
                className="w-full h-full border border-gray-200 rounded-md"
                title="PDF Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                {loading ? "Generating PDF..." : "Your PDF preview will appear here"}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
