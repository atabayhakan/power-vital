// Robust money-amount parser for OCR'd bank receipts.
//
// Receipts in the KGS/RU/TR region use a SPACE (or non-breaking/thin space) as
// the thousands separator and a COMMA as the decimal separator, e.g.
//   "3 000,00"  → 3000.00   (three thousand)
// but US/other formats also appear:
//   "3,000.00"  → 3000.00
//   "3.000,00"  → 3000.00
//   "1000"      → 1000
//   "3000.50"   → 3000.50
//
// The previous implementation did `replace(/[\s,]/g, '')`, which stripped BOTH
// the space AND the comma, turning "3 000,00" into "300000" (100× too large).
//
// Rules:
//   • All whitespace is a thousands separator → removed.
//   • If BOTH '.' and ',' are present, the rightmost one is the decimal point;
//     the other is a thousands separator.
//   • If only one of '.'/',' is present, it is the decimal point UNLESS it looks
//     like a single thousands group (exactly 3 trailing digits, one separator) —
//     e.g. "3,000" / "3.000" → 3000.

const looksLikeDecimal = (s: string, sep: string): boolean => {
  const count = s.split(sep).length - 1;
  if (count !== 1) return false; // multiple separators ⇒ thousands grouping
  const trailing = s.length - s.lastIndexOf(sep) - 1;
  // 1, 2 or 4+ trailing digits ⇒ a decimal fraction. Exactly 3 ⇒ thousands group.
  return trailing === 1 || trailing === 2 || trailing >= 4;
};

export const parseReceiptAmount = (raw: string | null | undefined): number | null => {
  if (!raw) return null;
  // Drop every whitespace char (\s also matches NBSP/thin/narrow spaces in JS),
  // then keep only digits and separators.
  const s = raw.replace(/\s/g, '').replace(/[^\d.,]/g, '');
  if (!/\d/.test(s)) return null;

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');

  let decimalSep = '';
  if (lastComma >= 0 && lastDot >= 0) {
    decimalSep = lastComma > lastDot ? ',' : '.';
  } else if (lastComma >= 0) {
    decimalSep = looksLikeDecimal(s, ',') ? ',' : '';
  } else if (lastDot >= 0) {
    decimalSep = looksLikeDecimal(s, '.') ? '.' : '';
  }

  let normalized: string;
  if (decimalSep) {
    const thousandsSep = decimalSep === ',' ? '.' : ',';
    normalized = s.split(thousandsSep).join('').replace(decimalSep, '.');
  } else {
    normalized = s.replace(/[.,]/g, ''); // every separator is a thousands group
  }

  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
};
