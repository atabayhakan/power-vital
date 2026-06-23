// Tests for Product.accordions translation path — the manual admin
// i18n editor (PATCH /admin/i18n/record/.../ with arrayField+key+subField)
// writes into Product.translations[locale].accordions[]. The accordion
// entries are matched by `key` (stable id like "storage"), with each
// item carrying { key, title, content } — both translatable.
//
// We exercise the registry / collectFilledKeys / snapshot logic
// without touching Prisma. No AI involved.
import { describe, it, expect } from 'vitest';
import { TRANSLATABLE_MODELS, computeTranslationCoverage, collectFilledKeys } from '../src/i18n/fields';

describe('Product.accordions translation', () => {
  it('accordions is registered as object-array (itemType=object, matchBy=key)', () => {
    const productSchema = TRANSLATABLE_MODELS.Product;
    const accordions = productSchema.arrayFields?.find(a => a.name === 'accordions');
    expect(accordions).toBeDefined();
    expect(accordions?.itemType).toBe('object');
    expect(accordions?.matchBy).toBe('key');
    expect(accordions?.fields).toEqual(['title', 'content']);
  });

  it('collectFilledKeys records accordion keys filled across all locales', () => {
    const productSchema = TRANSLATABLE_MODELS.Product;
    const translations = {
      ru: { accordions: [{ key: 'storage', title: 'Хранение', content: '...' }] },
      kg: { accordions: [
        { key: 'storage', title: 'Сактоо', content: '...' },
        { key: 'usage', title: 'Колдонуу', content: '...' }
      ] }
    };
    const { arrays } = collectFilledKeys(translations, productSchema);
    const accordionsBucket = arrays.get('accordions');
    expect(accordionsBucket?.has('storage')).toBe(true);
    expect(accordionsBucket?.has('usage')).toBe(true);
  });

  it('computeTranslationCoverage is 0 when no accordion entries are translated', () => {
    expect(computeTranslationCoverage({ accordions: [{ key: 'storage', title: 'Saklama', content: 'Serin yerde' }] }, null)).toBe(0);
    expect(computeTranslationCoverage({ accordions: [{ key: 'storage', title: 'Saklama', content: 'Serin yerde' }] }, {})).toBe(0);
  });

  it('object-array items in accordions are matched by key (not index)', () => {
    // If admins re-order items in the source list, the matching by key
    // ensures translations stay attached to the right item. The
    // registry explicitly declares matchBy='key' to make this
    // contract part of the model.
    const accordions = TRANSLATABLE_MODELS.Product.arrayFields?.find(a => a.name === 'accordions');
    expect(accordions?.matchBy).toBe('key');
  });

  it('Product schema lists both accordions (object) and benefits (string) arrays', () => {
    const arr = TRANSLATABLE_MODELS.Product.arrayFields || [];
    const names = arr.map(a => a.name);
    expect(names).toContain('accordions');
    expect(names).toContain('benefits');
    // benefits is a string-array, accordions is an object-array
    expect(arr.find(a => a.name === 'benefits')?.itemType).toBe('string');
    expect(arr.find(a => a.name === 'accordions')?.itemType).toBe('object');
  });
});
