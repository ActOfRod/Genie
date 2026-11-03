"use client";

import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { withBase } from "../utils";

/**
 * pdf.js assets copied to public/pdfjs by scripts/copy-pdfjs-assets.mjs.
 * The worker is loaded from this URL, not bundled. Next/Turbopack rewrites
 * `new Worker(new URL("pdfjs-dist/..."))` into a classic worker whose messages
 * arrive without an action ("Unknown action from worker: undefined").
 */
function pdfjsAsset(file: string) {
  return withBase(`/pdfjs/${file}`);
}

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const workerSrc = pdfjsAsset("pdf.worker.min.js");
  if (pdfjs.GlobalWorkerOptions.workerSrc !== workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  }
  return pdfjs;
}

type TextChunk = { items?: TextItem[] };

/**
 * pdf.js getTextContent() does `for await` on a ReadableStream. Safari still
 * has no ReadableStream async iterator, and that throws
 * "undefined is not a function (near '...t of e...')". getReader() works.
 */
export async function readTextChunks(stream: ReadableStream<TextChunk>): Promise<TextItem[]> {
  const reader = stream.getReader();
  const items: TextItem[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = value?.items;
      if (!chunk) continue;
      for (let index = 0; index < chunk.length; index += 1) items.push(chunk[index]);
    }
  } finally {
    reader.releaseLock();
  }
  return items;
}

/**
 * Pull the visible text out of a PDF as lines (top-to-bottom, left-to-right).
 * Runs entirely in the browser; the file never leaves the device.
 */
export async function extractPdfLines(data: ArrayBuffer): Promise<string[]> {
  const pdfjs = await loadPdfjs();

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(data),
    standardFontDataUrl: pdfjsAsset("standard_fonts/"),
    cMapUrl: pdfjsAsset("cmaps/"),
    cMapPacked: true,
    wasmUrl: pdfjsAsset("wasm/"),
  });
  const lines: string[] = [];
  try {
    const doc = await loadingTask.promise;
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const textItems = await readTextChunks(page.streamTextContent());
      const rows: Array<{ y: number; height: number; items: Array<{ x: number; width: number; str: string }> }> = [];

      for (const item of textItems) {
        if (typeof item.str !== "string" || !item.str.trim()) continue;
        const x = item.transform[4];
        const y = item.transform[5];
        const height = Math.abs(item.height) || 8;
        // Amex prints the date, merchant, and amount a few pixels off one baseline.
        // Keep the first baseline as the anchor so nearby rows do not chain together.
        const row = rows.find((candidate) => {
          const band = Math.max(7, Math.min(candidate.height, height) * 0.6);
          return Math.abs(candidate.y - y) <= band;
        });
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
