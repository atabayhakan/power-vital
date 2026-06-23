// Unit tests for the CSV utility — RFC 4180 compliance + Excel compatibility.
import { describe, it, expect } from 'vitest';
import { escapeCsvField, toCsv, type CsvColumn } from '../src/utils/csv';

describe('escapeCsvField', () => {
  it('returns simple ASCII as-is (no quotes)', () => {
    expect(escapeCsvField('hello')).toBe('hello');
  });

  it('returns empty string for null/undefined', () => {
    expect(escapeCsvField(null)).toBe('');
    expect(escapeCsvField(undefined)).toBe('');
  });

  it('coerces numbers to string', () => {
    expect(escapeCsvField(42)).toBe('42');
    expect(escapeCsvField(0)).toBe('0');
  });

  it('wraps fields containing comma in double quotes', () => {
    expect(escapeCsvField('a,b')).toBe('"a,b"');
  });

  it('doubles internal double quotes (RFC 4180)', () => {
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });

  it('preserves \n and \r inside quoted fields', () => {
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
    expect(escapeCsvField('line1\r\nline2')).toBe('"line1\r\nline2"');
  });

  it('handles all special characters together', () => {
    expect(escapeCsvField('a,b"c\nd')).toBe('"a,b""c\nd"');
  });

  it('does NOT wrap fields that are safe', () => {
    expect(escapeCsvField('plain text')).toBe('plain text');
    expect(escapeCsvField('has-dash')).toBe('has-dash');
    expect(escapeCsvField('has_underscore')).toBe('has_underscore');
  });
});

describe('toCsv', () => {
  interface Row { name: string; age: number; city: string }

  const columns: CsvColumn<Row>[] = [
    { header: 'Name', value: r => r.name },
    { header: 'Age',  value: r => r.age },
    { header: 'City', value: r => r.city }
  ];

  it('produces header + data rows', () => {
    const csv = toCsv(
      [{ name: 'Ali', age: 30, city: 'Bishkek' }],
      columns
    );
    // BOM + header + 1 row + trailing EOL
    expect(csv).toBe('\uFEFFName,Age,City\r\nAli,30,Bishkek\r\n');
  });

  it('emits UTF-8 BOM by default (Excel auto-detect)', () => {
    const csv = toCsv([], columns);
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
  });

  it('skips BOM when bom:false', () => {
    const csv = toCsv([], columns, { bom: false });
    expect(csv.charCodeAt(0)).not.toBe(0xFEFF);
  });

  it('emits \r\n by default, \n when requested', () => {
    const csvCRLF = toCsv([{ name: 'A', age: 1, city: 'B' }], columns);
    const csvLF  = toCsv([{ name: 'A', age: 1, city: 'B' }], columns, { lineEnding: '\n' });
    expect(csvCRLF).toContain('\r\n');
    expect(csvLF).not.toContain('\r\n');
    expect(csvLF).toContain('\n');
  });

  it('escapes commas, quotes, and newlines in data', () => {
    const csv = toCsv(
      [
        { name: 'Ali, Jr.', age: 30, city: 'Bishkek' },
        { name: 'Bob "the builder"', age: 25, city: 'Osh' },
        { name: 'Cem', age: 28, city: 'Multi\nline city' }
      ],
      columns
    );
    expect(csv).toContain('"Ali, Jr.",30,Bishkek');
    expect(csv).toContain('"Bob ""the builder""",25,Osh');
    expect(csv).toContain('Cem,28,"Multi\nline city"');
  });

  it('emits trailing newline after last row (POSIX-friendly)', () => {
    const csv = toCsv([{ name: 'Ali', age: 30, city: 'Bishkek' }], columns);
    expect(csv.endsWith('\r\n')).toBe(true);
  });

  it('handles empty array (header only)', () => {
    const csv = toCsv([], columns, { bom: false });
    expect(csv).toBe('Name,Age,City\r\n');
  });

  it('escapes null values to empty string', () => {
    const csv = toCsv(
      [{ name: null as any, age: 30, city: undefined as any }],
      columns,
      { bom: false }
    );
    expect(csv).toContain(',30,\r\n');
  });

  it('preserves special chars from user content', () => {
    // The note column might contain quotes, commas, newlines from admin
    // form input. Make sure they survive the round-trip.
    const row = { name: 'Test', age: 1, city: 'has "quotes", commas, and\nnewlines' };
    const csv = toCsv([row], columns, { bom: false });
    expect(csv).toContain('"has ""quotes"", commas, and\nnewlines"');
  });
});
