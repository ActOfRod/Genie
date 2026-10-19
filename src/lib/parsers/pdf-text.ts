"use client";

import type { TextItem } from "pdfjs-dist/types/src/display/api";

/**
 * Pull the visible text out of a PDF as lines (top-to-bottom, left-to-right).
 * Runs entirely in the browser; the file never leaves the device.
 */
export async function extractPdfLines(data: ArrayBuffer): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (!pdfjs.GlobalWorkerOptions.workerPort) {
    pdfjs.GlobalWorkerOptions.workerPort = new Worker(
      new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url),
      { type: "module" },
    );
  }

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(data) });
  const lines: string[] = [];
  try {
    const doc = await loadingTask.promise;
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      const rows: Array<{ y: number; height: number; items: Array<{ x: number; width: number; str: string }> }> = [];

      for (const raw of content.items) {
        const item = raw as TextItem;
        if (typeof item.str !== "string" || !item.str.trim()) continue;
        const x = item.transform[4];
        const y = item.transform[5];
        const height = Math.abs(item.height) || 8;
        const row = rows.find((candidate) => Math.abs(candidate.y - y) <= Math.max(2, Math.min(candidate.height, height) / 2));
        if (row) {
          row.items.push({ x, width: item.width, str: item.str });
        } else {
          rows.push({ y, height, items: [{ x, width: item.width, str: item.str }] });
        }
      }

      rows.sort((a, b) => b.y - a.y);
      for (const row of rows) {
        row.items.sort((a, b) => a.x - b.x);
        let text = "";
        let lastEnd: number | null = null;
        for (const item of row.items) {
          if (lastEnd !== null && item.x - lastEnd > 0.5) text += " ";
          text += item.str;
          lastEnd = item.x + item.width;
        }
        lines.push(text.replace(/\s+/g, " ").trim());
      }
      page.cleanup();
    }
  } finally {
    await loadingTask.destroy();
  }
  return lines.filter(Boolean);
}
