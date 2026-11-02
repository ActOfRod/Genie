import { spawnSync } from "node:child_process";
import path from "node:path";
import type { NextConfig } from "next";

// pdf.js must load its worker, fonts, and cmaps as real files. Turbopack's
// wrapped worker reports "Unknown action from worker: undefined".
const copy = spawnSync(process.execPath, [path.join(process.cwd(), "scripts/copy-pdfjs-assets.mjs")], {
  stdio: "inherit",
});
if (copy.status !== 0) {
  throw new Error("Failed to copy pdf.js assets into public/pdfjs");
}

const basePath = process.env.GITHUB_PAGES === "true" ? "/Genie" : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(basePath
    ? {
        basePath,
        assetPrefix: basePath,
      }
    : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;