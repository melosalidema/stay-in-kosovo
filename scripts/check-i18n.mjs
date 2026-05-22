import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(__dirname, "../src/i18n/locales");
const fallback = "en";

function flattenKeys(value, prefix = "") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenKeys(item, `${prefix}.${index}`.replace(/^\./, "")));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => flattenKeys(item, `${prefix}.${key}`.replace(/^\./, "")));
  }

  return [prefix];
}

function readLocale(locale) {
  return JSON.parse(fs.readFileSync(path.join(localesDir, `${locale}.json`), "utf8"));
}

const localeFiles = fs.readdirSync(localesDir).filter((file) => file.endsWith(".json"));
const locales = localeFiles.map((file) => path.basename(file, ".json"));
const fallbackKeys = new Set(flattenKeys(readLocale(fallback)));
let failed = false;

for (const locale of locales.filter((item) => item !== fallback)) {
  const keys = new Set(flattenKeys(readLocale(locale)));
  const missing = [...fallbackKeys].filter((key) => !keys.has(key));
  const extra = [...keys].filter((key) => !fallbackKeys.has(key));

  if (missing.length || extra.length) {
    failed = true;
    console.error(`[i18n] ${locale}: ${missing.length} missing, ${extra.length} extra`);
    if (missing.length) console.error(`  missing: ${missing.slice(0, 25).join(", ")}`);
    if (extra.length) console.error(`  extra: ${extra.slice(0, 25).join(", ")}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log(`[i18n] ${locales.length} locales match ${fallback}.`);
