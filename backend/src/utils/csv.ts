// CSV utility — RFC 4180 compliant serializer for export endpoints.
//
// Why not a library?
//   • Our schema is small (8 columns max) — a 30-line function is enough.
//   • We control the escape rules: quotes inside fields are doubled,
//     CR/LF inside fields are kept as-is (RFC 4180 allows them inside
//     quoted fields).
//   • Output always starts with a UTF-8 BOM so Excel auto-detects the
//     encoding when opening .csv files directly.

/**
 * Escape a single field for CSV output.
 * - Wraps in double quotes if it contains: , " \r \n
 * - Doubles internal double quotes
 * - Leaves everything else untouched
 */
export const escapeCsvField = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const s = typeof value === 'string' ? value : String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
};

export interface CsvColumn<T> {
  /** Header text shown in the first row */
  header: string;
  /** Extract the cell value from a row */
  value: (row: T) => unknown;
}

/**
 * Serialize an array of objects to a CSV string.
 *
 * @param rows     data to serialize
 * @param columns  column definitions (header + value extractor)
 * @param options.bom include UTF-8 BOM (default true)
 * @param options.lineEnding '\r\n' (RFC 4180 default) or '\n' for unix tools
 */
export const toCsv = <T>(
  rows: T[],
  columns: CsvColumn<T>[],
  options: { bom?: boolean; lineEnding?: '\n' | '\r\n' } = {}
): string => {
  const { bom = true, lineEnding = '\r\n' } = options;
  const eol = lineEnding;
  const lines: string[] = [];

  // Header row
  lines.push(columns.map(c => escapeCsvField(c.header)).join(','));

  // Data rows
  for (const row of rows) {
    lines.push(columns.map(c => escapeCsvField(c.value(row))).join(','));
  }

  const body = lines.join(eol) + eol;
  return bom ? '\uFEFF' + body : body;
};
