"use client";

import { useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isValidEmailFormat } from "@/lib/email-format";
import { importLeadsFromRows } from "@/app/(dashboard)/dashboard/campaigns/actions";

const NONE_VALUE = "__none__";
const FIELD_KEYS = ["name", "email", "phone", "category"] as const;
type FieldKey = (typeof FIELD_KEYS)[number];
const FIELD_LABELS: Record<FieldKey, string> = {
  name: "Business Name",
  email: "Email",
  phone: "Phone",
  category: "Category",
};
const FIELD_GUESSES: Record<FieldKey, string[]> = {
  name: ["name", "business", "company", "business name"],
  email: ["email", "e-mail"],
  phone: ["phone", "tel", "telephone"],
  category: ["category", "industry", "type"],
};

type ParseResult =
  | { kind: "tabular"; headers: string[]; rows: string[][] }
  | { kind: "pdf"; emails: string[] };

function guessMapping(headers: string[]): Record<FieldKey, string> {
  const mapping: Record<FieldKey, string> = {
    name: NONE_VALUE,
    email: NONE_VALUE,
    phone: NONE_VALUE,
    category: NONE_VALUE,
  };
  for (const field of FIELD_KEYS) {
    const guesses = FIELD_GUESSES[field];
    const matchIndex = headers.findIndex((h) =>
      guesses.includes(h.toLowerCase().trim())
    );
    if (matchIndex >= 0) mapping[field] = headers[matchIndex];
  }
  return mapping;
}

export function WizardImportPicker({
  onImported,
}: {
  onImported: (leads: Array<{ id: string; name: string }>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>({
    name: NONE_VALUE,
    email: NONE_VALUE,
    phone: NONE_VALUE,
    category: NONE_VALUE,
  });
  const [importedCount, setImportedCount] = useState<number | null>(null);

  async function handleFileChange(file: File) {
    setFileName(file.name);
    setError(null);
    setResult(null);
    setImportedCount(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/leads/import/parse", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as ParseResult & { error?: string };
      if (!response.ok)
        throw new Error(
          (data as { error?: string }).error ?? "Couldn't parse file."
        );

      setResult(data);
      if (data.kind === "tabular") setMapping(guessMapping(data.headers));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't parse file.");
    } finally {
      setIsUploading(false);
    }
  }

  const nameColumnIndex =
    result?.kind === "tabular" ? result.headers.indexOf(mapping.name) : -1;
  const emailColumnIndex =
    result?.kind === "tabular" ? result.headers.indexOf(mapping.email) : -1;
  const phoneColumnIndex =
    result?.kind === "tabular" ? result.headers.indexOf(mapping.phone) : -1;
  const categoryColumnIndex =
    result?.kind === "tabular" ? result.headers.indexOf(mapping.category) : -1;

  const validCount = useMemo(() => {
    if (!result) return 0;
    if (result.kind === "pdf") return result.emails.length;
    if (nameColumnIndex < 0) return 0;
    return result.rows.filter((row) => {
      const name = row[nameColumnIndex]?.trim();
      if (!name) return false;
      if (emailColumnIndex < 0) return true;
      const email = row[emailColumnIndex]?.trim();
      return !email || isValidEmailFormat(email);
    }).length;
  }, [result, nameColumnIndex, emailColumnIndex]);

  async function handleImport() {
    if (!result) return;
    setIsImporting(true);
    setError(null);
    try {
      let rows: Array<{
        name: string;
        email: string | null;
        phone: string | null;
        category: string | null;
      }>;

      if (result.kind === "pdf") {
        rows = result.emails.map((email) => ({
          name: email.split("@")[0].replace(/[._]/g, " "),
          email,
          phone: null,
          category: null,
        }));
      } else {
        rows = result.rows
          .map((row) => ({
            name:
              nameColumnIndex >= 0 ? (row[nameColumnIndex]?.trim() ?? "") : "",
            email:
              emailColumnIndex >= 0
                ? row[emailColumnIndex]?.trim() || null
                : null,
            phone:
              phoneColumnIndex >= 0
                ? row[phoneColumnIndex]?.trim() || null
                : null,
            category:
              categoryColumnIndex >= 0
                ? row[categoryColumnIndex]?.trim() || null
                : null,
          }))
          .filter(
            (row) => row.name && (!row.email || isValidEmailFormat(row.email))
          );
      }

      const { leadIds } = await importLeadsFromRows(rows);
      onImported(
        leadIds.map((id, index) => ({
          id,
          name: rows[index]?.name ?? "Imported lead",
        }))
      );
      setImportedCount(leadIds.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't import leads.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileChange(file);
        }}
      />
      <Card
        className="hover:bg-muted/40 cursor-pointer border-dashed"
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center px-6 py-10 text-center">
          <Upload
            className="text-muted-foreground mb-2 size-6"
            aria-hidden="true"
          />
          <p className="text-sm font-medium">
            {fileName ?? "Click to upload a CSV, Excel, or PDF file"}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">10MB max</p>
        </CardContent>
      </Card>

      {isUploading && (
        <p className="text-muted-foreground text-sm">Parsing file…</p>
      )}
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      {result?.kind === "tabular" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FIELD_KEYS.map((field) => (
              <div key={field} className="space-y-1.5">
                <Label>{FIELD_LABELS[field]}</Label>
                <Select
                  value={mapping[field]}
                  onValueChange={(v: string | null) =>
                    v && setMapping((m) => ({ ...m, [field]: v }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {result.headers.map((header, i) => (
                      <SelectItem key={`${header}-${i}`} value={header}>
                        {header || `Column ${i + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <p className="text-sm">
            <span className="font-medium">{validCount.toLocaleString()}</span>{" "}
            of {result.rows.length.toLocaleString()} rows are valid leads
          </p>
        </div>
      )}

      {result?.kind === "pdf" && (
        <p className="text-sm">
          Found <span className="font-medium">{result.emails.length}</span>{" "}
          email
          {result.emails.length === 1 ? "" : "s"} in this PDF.
        </p>
      )}

      {result && (
        <Button
          loading={isImporting}
          disabled={validCount === 0}
          onClick={handleImport}
        >
          Import {validCount.toLocaleString()} lead{validCount === 1 ? "" : "s"}
        </Button>
      )}

      {importedCount !== null && (
        <p className="text-success text-sm">
          Imported {importedCount.toLocaleString()} lead
          {importedCount === 1 ? "" : "s"}.
        </p>
      )}
    </div>
  );
}
