"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  MapPin,
  Phone,
  Globe,
  ExternalLink,
  Send,
  Trash2,
  ShieldCheck,
  Sparkles,
  RefreshCcw,
  StickyNote,
  Pencil,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScoreBadge, EmailCell } from "@/components/dashboard/lead-badges";
import { AddToCampaignDialog } from "@/components/dashboard/add-to-campaign-dialog";
import { DeleteLeadsDialog } from "@/components/dashboard/delete-leads-dialog";
import {
  deleteLeads,
  addLeadsToCampaign,
  updateLeadStatus,
  revalidateLeadEmail,
  getLeadNotes,
  addLeadNote,
  updateLeadNote,
  deleteLeadNote,
  getLeadActivity,
  type LeadNote,
  type LeadActivityEvent,
} from "@/app/(dashboard)/dashboard/leads/actions";
import type { LeadDetailRow } from "@/lib/types/leads-table";
import type {
  LeadStatus,
  LeadActivityEventType,
} from "@/lib/types/database.types";

const NOTE_AUTOSAVE_DEBOUNCE_MS = 800;

const STATUS_OPTIONS: Array<{ value: LeadStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "closed", label: "Closed" },
];

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X",
};

const BREAKDOWN_LABELS: Record<string, string> = {
  no_website: "No website",
  low_review_count: "Low review count",
  low_rating: "Low rating",
  missing_hours: "Missing business hours",
  no_social_presence: "No social media presence",
  poor_mobile_friendliness: "Poor mobile friendliness",
  no_ssl: "No SSL certificate",
};

const ACTIVITY_ICONS: Record<LeadActivityEventType, typeof Sparkles> = {
  created: Sparkles,
  status_changed: RefreshCcw,
  note_added: StickyNote,
  note_updated: StickyNote,
  note_deleted: Trash2,
  email_validated: ShieldCheck,
  added_to_campaign: Send,
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function LeadDetailView({ leadId }: { leadId: string }) {
  const router = useRouter();

  const [lead, setLead] = useState<LeadDetailRow | null>(null);
  const [isLoadingLead, setIsLoadingLead] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [activity, setActivity] = useState<LeadActivityEvent[]>([]);

  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  const [newNoteBody, setNewNoteBody] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const noteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadLead = useCallback(async () => {
    setIsLoadingLead(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/leads/${leadId}`);
      if (!response.ok) throw new Error("Couldn't load this lead.");
      const data = (await response.json()) as { lead: LeadDetailRow };
      setLead(data.lead);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setIsLoadingLead(false);
    }
  }, [leadId]);

  const refreshActivity = useCallback(async () => {
    try {
      setActivity(await getLeadActivity(leadId));
    } catch {
      // Non-critical — the timeline just won't reflect the very latest
      // event until the next successful refresh.
    }
  }, [leadId]);

  useEffect(() => {
    loadLead();
    getLeadNotes(leadId)
      .then(setNotes)
      .catch(() => undefined);
    refreshActivity();
  }, [leadId, loadLead, refreshActivity]);

  async function handleCopyPhone() {
    if (!lead?.phone) return;
    try {
      await navigator.clipboard.writeText(lead.phone);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    } catch {
      setNotice({ type: "error", message: "Couldn't copy to clipboard." });
    }
  }

  async function handleStatusChange(status: LeadStatus) {
    if (!lead || status === lead.status) return;
    const previous = lead.status;
    setLead({ ...lead, status });
    setIsStatusUpdating(true);
    try {
      await updateLeadStatus(leadId, status);
      refreshActivity();
    } catch (err) {
      setLead((current) =>
        current ? { ...current, status: previous } : current
      );
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Couldn't update status.",
      });
    } finally {
      setIsStatusUpdating(false);
    }
  }

  async function handleRevalidateEmail() {
    setIsRevalidating(true);
    try {
      const { status } = await revalidateLeadEmail(leadId);
      setLead((current) =>
        current ? { ...current, email_validation_status: status } : current
      );
      refreshActivity();
    } catch (err) {
      setNotice({
        type: "error",
        message:
          err instanceof Error ? err.message : "Couldn't re-validate email.",
      });
    } finally {
      setIsRevalidating(false);
    }
  }

  async function handleAddNote() {
    const body = newNoteBody.trim();
    if (!body) return;
    setIsAddingNote(true);
    try {
      const note = await addLeadNote(leadId, body);
      setNotes((prev) => [note, ...prev]);
      setNewNoteBody("");
      refreshActivity();
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Couldn't add note.",
      });
    } finally {
      setIsAddingNote(false);
    }
  }

  function startEditingNote(note: LeadNote) {
    setEditingNoteId(note.id);
    setEditingBody(note.body);
  }

  function handleEditingBodyChange(noteId: string, value: string) {
    setEditingBody(value);
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, body: value } : n))
    );

    if (noteDebounceRef.current) clearTimeout(noteDebounceRef.current);
    noteDebounceRef.current = setTimeout(async () => {
      try {
        await updateLeadNote(noteId, leadId, value);
        refreshActivity();
      } catch (err) {
        setNotice({
          type: "error",
          message: err instanceof Error ? err.message : "Couldn't save note.",
        });
      }
    }, NOTE_AUTOSAVE_DEBOUNCE_MS);
  }

  function stopEditingNote() {
    if (noteDebounceRef.current) {
      clearTimeout(noteDebounceRef.current);
      noteDebounceRef.current = null;
    }
    setEditingNoteId(null);
  }

  async function handleDeleteNote(noteId: string) {
    const previous = notes;
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    try {
      await deleteLeadNote(noteId, leadId);
      refreshActivity();
    } catch (err) {
      setNotes(previous);
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Couldn't delete note.",
      });
    }
  }

  async function handleAddToCampaignSubmit(
    input: Parameters<typeof addLeadsToCampaign>[1]
  ) {
    await addLeadsToCampaign([leadId], input);
    await refreshActivity();
  }

  async function handleDeleteLead() {
    setIsDeleting(true);
    try {
      await deleteLeads([leadId]);
      router.push("/dashboard/leads");
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Couldn't delete lead.",
      });
      setIsDeleting(false);
    }
  }

  if (isLoadingLead) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (loadError || !lead) {
    return (
      <Card>
        <CardContent className="text-destructive px-6 py-16 text-center text-sm">
          {loadError ?? "Lead not found."}
        </CardContent>
      </Card>
    );
  }

  const socialEntries = Object.entries(lead.social_links).filter(
    ([, url]) => !!url
  );
  const breakdownEntries = Object.entries(
    lead.opportunity_score_breakdown
  ).filter(([, points]) => points !== undefined);
  const mapsUrl =
    lead.google_maps_url ??
    (lead.address
      ? `https://www.google.com/maps/search/${encodeURIComponent(lead.address)}`
      : null);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/leads"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Leads
      </Link>

      {notice && (
        <p
          className={
            notice.type === "success"
              ? "text-success text-sm"
              : "text-destructive text-sm"
          }
          role="status"
        >
          {notice.message}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{lead.name}</h1>
          <p className="text-muted-foreground mt-1">
            {lead.category ?? "Uncategorized"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </Button>
          <Button onClick={() => setCampaignDialogOpen(true)}>
            <Send className="size-4" aria-hidden="true" />
            Add to Campaign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Opportunity Score</CardTitle>
              <ScoreBadge score={lead.opportunity_score} />
            </CardHeader>
            <CardContent>
              {breakdownEntries.length > 0 ? (
                <Accordion>
                  <AccordionItem value="breakdown">
                    <AccordionTrigger>See score breakdown</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-1.5">
                        {breakdownEntries.map(([factor, points]) => (
                          <li
                            key={factor}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{BREAKDOWN_LABELS[factor] ?? factor}</span>
                            <span className="text-muted-foreground">
                              +{points}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No scoring factors recorded.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {lead.phone && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Phone
                      className="text-muted-foreground size-4"
                      aria-hidden="true"
                    />
                    {lead.phone}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleCopyPhone}>
                    {copyFeedback ? (
                      <>
                        <Check className="size-3.5" aria-hidden="true" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" aria-hidden="true" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              )}

              {lead.address && (
                <div className="flex items-start justify-between gap-2">
                  <span className="flex items-start gap-2">
                    <MapPin
                      className="text-muted-foreground mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    {lead.address}
                  </span>
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary inline-flex shrink-0 items-center gap-1 hover:underline"
                    >
                      Map
                      <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
              )}

              {lead.website_url && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Globe
                      className="text-muted-foreground size-4"
                      aria-hidden="true"
                    />
                    {lead.website_url.replace(/^https?:\/\//, "")}
                  </span>
                  <a
                    href={lead.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 hover:underline"
                  >
                    Visit
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between">
                <EmailCell
                  email={lead.email}
                  status={lead.email_validation_status}
                />
                {lead.email && (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={isRevalidating}
                    onClick={handleRevalidateEmail}
                  >
                    Re-validate
                  </Button>
                )}
              </div>

              {socialEntries.length > 0 && (
                <div className="flex flex-wrap gap-3 border-t pt-3">
                  {socialEntries.map(([key, url]) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {SOCIAL_LABELS[key] ?? key}
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <textarea
                  value={newNoteBody}
                  onChange={(e) => setNewNoteBody(e.target.value)}
                  placeholder="Add a note about this lead…"
                  rows={2}
                  className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-2 text-sm transition-colors outline-none focus-visible:ring-3"
                />
                <Button
                  size="sm"
                  loading={isAddingNote}
                  onClick={handleAddNote}
                  disabled={!newNoteBody.trim()}
                >
                  Add Note
                </Button>
              </div>

              {notes.length === 0 ? (
                <p className="text-muted-foreground text-sm">No notes yet.</p>
              ) : (
                <ul className="space-y-3">
                  {notes.map((note) => (
                    <li
                      key={note.id}
                      className="border-border rounded-lg border p-3"
                    >
                      {editingNoteId === note.id ? (
                        <textarea
                          autoFocus
                          value={editingBody}
                          onChange={(e) =>
                            handleEditingBodyChange(note.id, e.target.value)
                          }
                          onBlur={stopEditingNote}
                          rows={3}
                          className="w-full resize-none bg-transparent text-sm outline-none"
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">
                          {note.body}
                        </p>
                      )}
                      <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
                        <span>
                          {formatTimestamp(note.updatedAt)}
                          {note.updatedAt !== note.createdAt && " (edited)"}
                        </span>
                        <div className="flex items-center gap-1">
                          {editingNoteId !== note.id && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => startEditingNote(note)}
                            >
                              <Pencil className="size-3.5" aria-hidden="true" />
                              <span className="sr-only">Edit note</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-destructive"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                            <span className="sr-only">Delete note</span>
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={lead.status}
                onValueChange={(value: string | null) =>
                  value && handleStatusChange(value as LeadStatus)
                }
              >
                <SelectTrigger className="w-full" disabled={isStatusUpdating}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No activity yet.
                </p>
              ) : (
                <ol className="space-y-4">
                  {activity.map((event) => {
                    const Icon = ACTIVITY_ICONS[event.eventType] ?? Sparkles;
                    return (
                      <li key={event.id} className="flex gap-3">
                        <div className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-full">
                          <Icon
                            className="text-muted-foreground size-3.5"
                            aria-hidden="true"
                          />
                        </div>
                        <div>
                          <p className="text-sm">{event.message}</p>
                          <p className="text-muted-foreground text-xs">
                            {formatTimestamp(event.createdAt)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AddToCampaignDialog
        open={campaignDialogOpen}
        onOpenChange={setCampaignDialogOpen}
        leadCount={1}
        onSubmit={handleAddToCampaignSubmit}
      />

      <DeleteLeadsDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        count={1}
        isDeleting={isDeleting}
        onConfirm={handleDeleteLead}
      />
    </div>
  );
}
