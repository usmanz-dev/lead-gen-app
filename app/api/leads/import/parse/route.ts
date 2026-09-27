import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseCsv, parseXlsx, parsePdfEmails } from "@/lib/import-parsers";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

/**
 * Step 1's "Import File" tab — parses an uploaded CSV/Excel/PDF into rows
 * (or, for a PDF, extracted emails) for the client's column-mapping UI.
 * Nothing is written to the database here; that happens in
 * importLeadsFromRows once the user confirms the mapping.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "File is too large (10MB max)." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  try {
    if (name.endsWith(".csv")) {
      return NextResponse.json(parseCsv(buffer));
    }
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      return NextResponse.json(await parseXlsx(buffer));
    }
    if (name.endsWith(".pdf")) {
      return NextResponse.json(await parsePdfEmails(buffer));
    }
    return NextResponse.json(
      { error: "Unsupported file type. Use CSV, Excel, or PDF." },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Couldn't parse file.",
      },
      { status: 500 }
    );
  }
}
