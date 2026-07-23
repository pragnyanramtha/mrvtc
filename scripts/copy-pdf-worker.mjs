import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const src = resolve(root, "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");
const destDir = resolve(root, "src/vendor");
const dest = resolve(destDir, "pdf.worker.mjs");

if (!existsSync(src)) {
  console.error("pdfjs-dist worker not found. Run `npm install` or `pnpm install` first.");
  process.exit(1);
}

mkdirSync(destDir, { recursive: true });
cpSync(src, dest);
console.log(`Copied pdf.worker.mjs -> src/vendor/pdf.worker.mjs`);
