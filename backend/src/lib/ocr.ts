// Thin, mockable seam around tesseract.js.
//
// The receipt-verify route used to `require('tesseract.js')` inline at
// request time. That kept the (heavy) OCR engine lazily loaded — good —
// but a raw inline require isn't reliably intercepted by test module
// mocks, so the OCR integration tests always hit the real binary and
// failed. Extracting the call here gives tests one clean thing to mock
// (`vi.mock('../src/lib/ocr')`) while STILL lazy-loading tesseract.js the
// first time OCR actually runs.

/**
 * Run OCR over a receipt image and return the recognised text.
 * Throws if the engine/binary is unavailable or the file can't be read —
 * the caller decides how to handle that (mark order pending, etc.).
 */
export const recognizeReceiptText = async (imagePath: string): Promise<string> => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Tesseract = require('tesseract.js');
  const result = await Tesseract.recognize(imagePath, 'rus+kir+eng', {
    logger: () => { /* silent */ }
  });
  return result.data.text;
};
