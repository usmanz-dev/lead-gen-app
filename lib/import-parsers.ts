import "server-only";
import ExcelJS from "exceljs";
import { PDFParse } from "pdf-parse";

export interface TabularParseResult {
  kind: "tabular";
  headers: string[];
  rows: string[][];
}

export interface PdfParseResult {
  kind: "pdf";
  emails: string[];
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// A safety cap, not a realistic ceiling — keeps one malformed upload from
// producing an unbounded in-memory row set.
const MAX_ROWS = 5000;

/**
 * Minimal RFC4180-ish CSV line splitter: handles quoted fields (including
 * embedded commas and escaped "" quotes), which a plain split(",") breaks
 * on. Good enough for the simple "name,email,phone" exports most CRMs and
 * spreadsheets produce — not a full CSV grammar (no embedded newlines
 * inside a quoted field spanning multiple physical lines).
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

export function parseCsv(buffer: Buffer): TabularParseResult {
  const text = buffer.toString("utf-8");
  const lines = text
    .split(/\r\n|\n|\r/)
    .filter((line) => line.trim().length > 0);
  const rows = lines.slice(0, MAX_ROWS + 1).map(parseCsvLine);
  const [headers, ...dataRows] = rows;
  return { kind: "tabular", headers: headers ?? [], rows: dataRows };
}

export async function parseXlsx(buffer: Buffer): Promise<TabularParseResult> {
  const workbook = new ExcelJS.Workbook();
  // exceljs's bundled type defs pin an older, non-generic Buffer shape
  // than this project's @types/node — structurally identical at runtime,
  // hence the cast rather than a functional change.
  await workbook.xlsx.load(
    buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]
  );
  const sheet = workbook.worksheets[0];
  if (!sheet) return { kind: "tabular", headers: [], rows: [] };

  const allRows: string[][] = [];
  sheet.eachRow((row) => {
    if (allRows.length > MAX_ROWS) return;
    // exceljs's row.values is 1-indexed with a leading empty slot at [0].
    const values = (row.values as unknown[]).slice(1);
    allRows.push(
      values.map((v) => (v === null || v === undefined ? "" : String(v).trim()))
    );
  });

  const [headers, ...dataRows] = allRows;
  return { kind: "tabular", headers: headers ?? [], rows: dataRows };
}

/** PDFs don't have the tabular structure CSV/Excel exports do, so this
 * only pulls out email addresses from the raw text — an honest match for
 * "extract emails/text" rather than pretending to infer a business name
 * or phone from unstructured layout. */
export async function parsePdfEmails(buffer: Buffer): Promise<PdfParseResult> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const emails = Array.from(new Set(result.text.match(EMAIL_REGEX) ?? []));
    return { kind: "pdf", emails };
  } finally {
    await parser.destroy();
  }
}
