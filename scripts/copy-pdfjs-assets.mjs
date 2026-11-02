import { cpSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const pkg = path.join(root, "node_modules/pdfjs-dist");
const dest = path.join(root, "public/pdfjs");

mkdirSync(dest, { recursive: true });
// Served as .js so GitHub Pages sends a JavaScript MIME type. Module workers
// reject .mjs when the host labels it as a generic download.
cpSync(path.join(pkg, "legacy/build/pdf.worker.min.mjs"), path.join(dest, "pdf.worker.min.js"));
cpSync(path.join(pkg, "standard_fonts"), path.join(dest, "standard_fonts"), { recursive: true });
cpSync(path.join(pkg, "cmaps"), path.join(dest, "cmaps"), { recursive: true });
cpSync(path.join(pkg, "wasm"), path.join(dest, "wasm"), { recursive: true });
