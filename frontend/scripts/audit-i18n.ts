// i18n coverage auditor — reads all 3 locale files, reports key parity.
//
// We treat TR as canonical. RU and KG must have the same keys (or fall back
// to TR at runtime via the locale lookup chain). Output is JSON so it can
// be parsed by scripts/coverage-report.js or piped into CI checks.
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface LocaleData {
  locale: string;
  keys: string[];           // dotted key paths (sidebar.metrics, footer.title, …)
  missingFrom: string[];    // keys missing in this locale
  emptyValues: string[];    // keys that exist but have empty string value
  bySection: Record<string, number>;
}

const LOCALES_DIR = join(__dirname, '..', 'src', 'locales');
const LOCALES = ['tr', 'ru', 'kg'] as const;
const CANONICAL = 'tr';

const flatten = (obj: any, prefix = ''): string[] => {
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...flatten(v, path));
    } else {
      out.push(path);
    }
  }
  return out.sort();
};

const bySection = (keys: string[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const k of keys) {
    const section = k.split('.')[0];
    counts[section] = (counts[section] || 0) + 1;
  }
  return counts;
};

const valueAt = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
};

const localeData: Record<string, LocaleData> = {};

for (const locale of LOCALES) {
  const path = join(LOCALES_DIR, `${locale}.json`);
  const raw = readFileSync(path, 'utf8');
  const parsed = JSON.parse(raw);
  const keys = flatten(parsed);
  localeData[locale] = {
    locale,
    keys,
    missingFrom: [],
    emptyValues: [],
    bySection: bySection(keys)
  };
}

// Compute missing per locale
const canonicalKeys = new Set(localeData[CANONICAL].keys);
for (const locale of LOCALES) {
  if (locale === CANONICAL) continue;
  localeData[locale].missingFrom = [...canonicalKeys]
    .filter(k => !localeData[locale].keys.includes(k));
}

// Check empty values in each locale
for (const locale of LOCALES) {
  const parsed = JSON.parse(readFileSync(join(LOCALES_DIR, `${locale}.json`), 'utf8'));
  for (const k of localeData[locale].keys) {
    const v = valueAt(parsed, k);
    if (v === '' || v === null || v === undefined) {
      localeData[locale].emptyValues.push(k);
    }
  }
}

// Summary table
console.log('═'.repeat(70));
console.log('  i18n COVERAGE REPORT — Power Vital');
console.log('═'.repeat(70));
console.log();

for (const locale of LOCALES) {
  const data = localeData[locale];
  const missing = data.missingFrom.length;
  const empty = data.emptyValues.length;
  const total = data.keys.length;
  const target = canonicalKeys.size;
  const pct = ((total / target) * 100).toFixed(1);

  console.log(`  ${locale.toUpperCase().padEnd(4)} ${total}/${target} keys (${pct}%)  · missing: ${missing} · empty: ${empty}`);
}

console.log();
console.log('─'.repeat(70));
console.log('  Section breakdown (TR baseline):');
console.log('─'.repeat(70));
const sections = Object.keys(localeData[CANONICAL].bySection).sort();
for (const sec of sections) {
  const tr = localeData.tr.bySection[sec] || 0;
  const ru = localeData.ru.bySection[sec] || 0;
  const kg = localeData.kg.bySection[sec] || 0;
  console.log(`  ${sec.padEnd(15)} TR: ${String(tr).padStart(3)}  RU: ${String(ru).padStart(3)}  KG: ${String(kg).padStart(3)}`);
}

console.log();
console.log('─'.repeat(70));
console.log('  Missing translations:');
console.log('─'.repeat(70));

const hasMissing = LOCALES.filter(l => l !== CANONICAL).some(l => localeData[l].missingFrom.length > 0);
if (!hasMissing) {
  console.log('  ✅ All keys present in all locales.');
} else {
  for (const locale of LOCALES) {
    if (locale === CANONICAL) continue;
    const missing = localeData[locale].missingFrom;
    if (missing.length) {
      console.log(`\n  ${locale.toUpperCase()} missing (${missing.length}):`);
      for (const k of missing) console.log(`    - ${k}`);
    }
  }
}

console.log();
console.log('─'.repeat(70));
console.log('  Empty values:');
console.log('─'.repeat(70));

const hasEmpty = LOCALES.some(l => localeData[l].emptyValues.length > 0);
if (!hasEmpty) {
  console.log('  ✅ No empty values in any locale.');
} else {
  for (const locale of LOCALES) {
    const empty = localeData[locale].emptyValues;
    if (empty.length) {
      console.log(`  ${locale.toUpperCase()} (${empty.length}): ${empty.join(', ')}`);
    }
  }
}

// JSON output for CI consumption
const report = {
  generatedAt: new Date().toISOString(),
  canonical: CANONICAL,
  totalKeys: canonicalKeys.size,
  locales: Object.fromEntries(
    LOCALES.map(l => [l, {
      totalKeys: localeData[l].keys.length,
      missingCount: localeData[l].missingFrom.length,
      missingKeys: localeData[l].missingFrom,
      emptyValues: localeData[l].emptyValues,
      bySection: localeData[l].bySection,
      coverage: ((localeData[l].keys.length / canonicalKeys.size) * 100).toFixed(1)
    }])
  )
};

const reportPath = join(__dirname, '..', 'i18n-coverage.json');
writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log();
console.log(`📄 JSON report: ${reportPath}`);
console.log();

// Exit non-zero if any non-canonical locale is below 100%
const incomplete = LOCALES
  .filter(l => l !== CANONICAL)
  .some(l => localeData[l].missingFrom.length > 0);

if (incomplete) {
  console.log('❌ Coverage incomplete — see missing keys above.');
  process.exit(1);
} else {
  console.log('✅ 100% coverage in all locales.');
}
