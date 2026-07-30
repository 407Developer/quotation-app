import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import { compileTemplate } from "@/lib/template";
import { QuoteData } from "@/lib/types";

const CHROME_PATH =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export async function POST(req: NextRequest) {
  try {
    const data: QuoteData = await req.json();

    const html = compileTemplate(data as unknown as Record<string, unknown>);

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: CHROME_PATH,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" },
      printBackground: true,
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="quotation-${data.client_name.replace(/\s+/g, "_").toLowerCase()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
