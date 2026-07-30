import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { QuoteData } from "@/lib/types";

function getAI() {
  const key = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) return null;

  const provider = process.env.AI_PROVIDER || "openai";
  const config: Record<string, string> = { apiKey: key };

  if (provider === "groq") {
    config.baseURL = "https://api.groq.com/openai/v1";
  } else if (provider === "openai") {
    // default OpenAI
  }
  // Allow custom base URL override
  if (process.env.AI_BASE_URL) {
    config.baseURL = process.env.AI_BASE_URL;
  }

  return new OpenAI(config);
}

function getModel() {
  const provider = process.env.AI_PROVIDER || "openai";
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  if (provider === "groq") return "llama-3.3-70b-versatile";
  return "gpt-4o-mini";
}

const SYSTEM_PROMPT = `You are a quotation parser. Convert raw text flooring quotations into structured JSON.
Extract the following fields and return ONLY valid JSON (no markdown, no explanation):

{
  "client_name": "string",
  "date": "string (current date if not specified)",
  "title": "string (e.g. 'Quotation for Flooring Installation')",
  "company": {
    "name": "JOBON INTERNATIONAL LTD",
    "subtitle": "FLOORING & INTERIOR SOLUTIONS",
    "phone": "09165208580"
  },
  "items": [
    {
      "description": "string",
      "qty": number,
      "unit": "sqm or item",
      "rate": number (numeric only, no commas),
      "amount": number (qty * rate)
    }
  ],
  "summary": {
    "material_total": number,
    "material_sub": "string description",
    "accessories_total": number,
    "accessories_sub": "string description",
    "workmanship_total": number,
    "workmanship_sub": "string description",
    "grand_total": number (sum of material + accessories + workmanship)
  }
}

If the input text mentions quantities like "52sqm * 9,000", parse it as qty=52, unit=sqm, rate=9000.
Categorize each item as material, accessory, or workmanship based on its description.
All monetary values must be numbers (no commas, no currency symbols).`;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const client = getAI();
    if (!client) {
      const mockData = mockParse(prompt);
      return NextResponse.json(mockData);
    }

    const completion = await client.chat.completions.create({
      model: getModel(),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const cleaned = content.replace(/^```(?:json)?\s*/, "").replace(/\s*```\s*$/, "").trim();
    const data: QuoteData = JSON.parse(cleaned);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Parse quote error:", error);
    return NextResponse.json(
      { error: "Failed to parse quotation" },
      { status: 500 }
    );
  }
}

function mockParse(prompt: string): QuoteData {
  const lines = prompt.split("\n").filter((l) => l.trim());
  const clientName = lines[0]?.replace(/^.*?(?:for|client|Mr|Mrs|Ms)\s+/i, "").trim() || "Client";

  const items = [
    {
      description: "Vinyl Flooring",
      qty: 52,
      unit: "sqm",
      rate: 9000,
      amount: 468000,
    },
    {
      description: "Skirting Installation",
      qty: 40,
      unit: "m",
      rate: 2500,
      amount: 100000,
    },
    {
      description: "Adhesive & Accessories",
      qty: 1,
      unit: "lot",
      rate: 45000,
      amount: 45000,
    },
    {
      description: "Workmanship & Labour",
      qty: 1,
      unit: "lot",
      rate: 150000,
      amount: 150000,
    },
  ];

  return {
    client_name: clientName,
    date: new Date().toISOString().split("T")[0],
    title: "Quotation for Flooring Installation",
    company: {
      name: "JOBON INTERNATIONAL LTD",
      subtitle: "FLOORING & INTERIOR SOLUTIONS",
      phone: "09165208580",
    },
    items,
    summary: {
      material_total: 468000,
      material_sub: "Vinyl flooring (52sqm × ₦9,000)",
      accessories_total: 145000,
      accessories_sub: "Skirting (40m × ₦2,500) + Adhesives",
      workmanship_total: 150000,
      workmanship_sub: "Installation labour",
      grand_total: 763000,
    },
  };
}
