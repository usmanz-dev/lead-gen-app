"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EMAIL_FORMAT_REGEX } from "@/lib/email-format";
import { importLeadsFromRows } from "@/app/(dashboard)/dashboard/campaigns/actions";

const EMAIL_SEARCH_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

interface ParsedLine {
  name: string;
  email: string | null;
}

function parseLine(line: string): ParsedLine | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const emailMatch = trimmed.match(EMAIL_SEARCH_REGEX);
  if (!emailMatch) {
    return { name: trimmed, email: null };
  }
  const email = emailMatch[0];
  const rest = trimmed
    .replace(email, "")
    .replace(/[<>(),;]/g, "")
    .trim();
  return { name: rest || email.split("@")[0].replace(/[._]/g, " "), email };
}

export function WizardPastePicker({
  onImported,
}: {
  onImported: (leads: Array<{ id: string; name: string }>) => void;
}) {
  const [text, setText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const parsedLines = useMemo(
    () =>
      text
        .split("\n")
        .map(parseLine)
        .filter((line): line is ParsedLine => line !== null),
    [text]
  );
  const validLines = parsedLines.filter(
    (line) => !line.email || EMAIL_FORMAT_REGEX.test(line.email)
  );

  async function handleImport() {
    setIsImporting(true);
    setError(null);
    try {
      const rows = validLines.map((line) => ({
        name: line.name,
        email: line.email,
        phone: null,
        category: null,
      }));
      const { leadIds } = await importLeadsFromRows(rows);
      onImported(
        leadIds.map((id, index) => ({
          id,
          name: rows[index]?.name ?? "Imported lead",
        }))
      );
      setImportedCount(leadIds.length);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't import leads.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          "Paste one lead per line, e.g.:\nAcme Dental, acme@example.com\nbeta@example.com"
        }
        rows={8}
        className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-2 text-sm transition-colors outline-none focus-visible:ring-3"
      />

      <p className="text-sm">
        <span className="font-medium">
          {validLines.length.toLocaleString()}
        </span>{" "}
        of {parsedLines.length.toLocaleString()} lines are valid leads
      </p>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <Button
        loading={isImporting}
        disabled={validLines.length === 0}
        onClick={handleImport}
      >
        Import {validLines.length.toLocaleString()} lead
        {validLines.length === 1 ? "" : "s"}
      </Button>

      {importedCount !== null && (
        <p className="text-success text-sm">
          Imported {importedCount.toLocaleString()} lead
          {importedCount === 1 ? "" : "s"}.
        </p>
      )}
    </div>
  );
}
