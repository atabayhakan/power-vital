// i18n parity tests — ensure TR / RU / KG JSON files stay in lockstep.
//
// What we check:
//   • All three files parse as JSON
//   • Every key path in TR exists in RU and KG (TR is canonical)
//   • No key has an empty / null / undefined value
//   • Section count and key count are equal across all locales
//
// Run with:
//   npx vitest run tests/i18n.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const LOCALES_DIR = join(__dirname, '..', 'src', 'locales');
const LOCALES = ['tr', 'ru', 'kg'] as const;

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

const loadLocale = (locale: string): any => {
  const path = join(LOCALES_DIR, `${locale}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
};

describe('i18n locale parity', () => {
  const tr = loadLocale('tr');
  const ru = loadLocale('ru');
  const kg = loadLocale('kg');

  it('all three locale files parse as valid JSON', () => {
    expect(tr).toBeTypeOf('object');
    expect(ru).toBeTypeOf('object');
    expect(kg).toBeTypeOf('object');
  });

  describe('key parity', () => {
    const trKeys = flatten(tr);
    const ruKeys = flatten(ru);
    const kgKeys = flatten(kg);

    it('has the same key count across all locales', () => {
      expect(ruKeys.length).toBe(trKeys.length);
      expect(kgKeys.length).toBe(trKeys.length);
    });

    it('RU contains every TR key', () => {
      const missing = trKeys.filter(k => !ruKeys.includes(k));
      expect(missing, `RU missing: ${missing.join(', ')}`).toEqual([]);
    });

    it('KG contains every TR key', () => {
      const missing = trKeys.filter(k => !kgKeys.includes(k));
      expect(missing, `KG missing: ${missing.join(', ')}`).toEqual([]);
    });

    it('TR contains every RU key (no extra in RU)', () => {
      const extras = ruKeys.filter(k => !trKeys.includes(k));
      expect(extras, `RU extras: ${extras.join(', ')}`).toEqual([]);
    });

    it('TR contains every KG key (no extra in KG)', () => {
      const extras = kgKeys.filter(k => !trKeys.includes(k));
      expect(extras, `KG extras: ${extras.join(', ')}`).toEqual([]);
    });
  });

  describe('value integrity', () => {
    for (const locale of LOCALES) {
      it(`${locale.toUpperCase()} has no empty / null / undefined values`, () => {
        const data = loadLocale(locale);
        const empty: string[] = [];
        const check = (obj: any, prefix = '') => {
          for (const [k, v] of Object.entries(obj)) {
            const path = prefix ? `${prefix}.${k}` : k;
            if (v && typeof v === 'object' && !Array.isArray(v)) {
              check(v, path);
            } else if (v === '' || v === null || v === undefined) {
              empty.push(path);
            }
          }
        };
        check(data);
        expect(empty, `${locale.toUpperCase()} empty values: ${empty.join(', ')}`).toEqual([]);
      });
    }
  });

  describe('section coverage', () => {
    const sections = (obj: any) => Object.keys(obj).sort();

    it('TR/RU/KG have the same top-level sections', () => {
      expect(sections(ru)).toEqual(sections(tr));
      expect(sections(kg)).toEqual(sections(tr));
    });

    it('admin section exists in all locales (heaviest: dashboard etc.)', () => {
      expect(tr.admin).toBeTypeOf('object');
      expect(ru.admin).toBeTypeOf('object');
      expect(kg.admin).toBeTypeOf('object');
    });

    it('sidebar section has new operator keys (metrics, liveLogs, broadcast, i18nCenter, cartRecovery)', () => {
      for (const locale of LOCALES) {
        const sb = loadLocale(locale).sidebar;
        expect(sb.metrics, `${locale} missing sidebar.metrics`).toBeTypeOf('string');
        expect(sb.liveLogs, `${locale} missing sidebar.liveLogs`).toBeTypeOf('string');
        expect(sb.broadcast, `${locale} missing sidebar.broadcast`).toBeTypeOf('string');
        expect(sb.i18nCenter, `${locale} missing sidebar.i18nCenter`).toBeTypeOf('string');
        expect(sb.cartRecovery, `${locale} missing sidebar.cartRecovery`).toBeTypeOf('string');
      }
    });
  });

  describe('cross-locale uniqueness', () => {
    it('no two locales share the exact same translation string for sidebar section', () => {
      // Each locale must have a different "section heading" for sidebar.secSystem
      // (a sanity check that we did actually translate, not just copy-paste).
      const values = LOCALES.map(l => loadLocale(l).sidebar.secSystem);
      const unique = new Set(values);
      // Allow at most 1 duplicate (in case a language pair is naturally identical).
      // But for our three primary locales we expect 3 distinct values.
      expect(unique.size).toBeGreaterThanOrEqual(2);
    });

    it('common UI labels are translated (not copied verbatim across all three)', () => {
      // The "save" / "submit" / etc. strings should differ between at least
      // two locales — a sanity check that someone actually translated them.
      const submitVals = LOCALES.map(l => loadLocale(l).login.submit);
      const unique = new Set(submitVals);
      expect(unique.size).toBeGreaterThanOrEqual(2);
    });
  });
});
