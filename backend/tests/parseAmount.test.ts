import { describe, it, expect } from 'vitest';
import { parseReceiptAmount } from '../src/utils/parseAmount';

describe('parseReceiptAmount', () => {
  it('reads a space as a thousands separator and comma as decimal (KGS format)', () => {
    expect(parseReceiptAmount('3 000,00')).toBe(3000);       // regular space
    expect(parseReceiptAmount('3 000,00')).toBe(3000);  // non-breaking space
    expect(parseReceiptAmount('3 000')).toBe(3000);
    expect(parseReceiptAmount('12 500,50')).toBe(12500.5);
    expect(parseReceiptAmount('1 234 567,89')).toBe(1234567.89);
  });

  it('handles plain integers (regression for existing OCR cases)', () => {
    expect(parseReceiptAmount('1000')).toBe(1000);
    expect(parseReceiptAmount('500')).toBe(500);
    expect(parseReceiptAmount('250000')).toBe(250000);
  });

  it('handles US and EU separator styles', () => {
    expect(parseReceiptAmount('3,000.00')).toBe(3000); // US: comma thousands, dot decimal
    expect(parseReceiptAmount('3.000,00')).toBe(3000); // EU: dot thousands, comma decimal
    expect(parseReceiptAmount('3000.50')).toBe(3000.5);
    expect(parseReceiptAmount('3000,00')).toBe(3000);
  });

  it('treats a single 3-digit group as thousands, not a decimal', () => {
    expect(parseReceiptAmount('3,000')).toBe(3000);
    expect(parseReceiptAmount('1,234,567')).toBe(1234567);
  });

  it('returns null when there is no number', () => {
    expect(parseReceiptAmount('')).toBeNull();
    expect(parseReceiptAmount(null)).toBeNull();
    expect(parseReceiptAmount('Сумма: —')).toBeNull();
  });
});
