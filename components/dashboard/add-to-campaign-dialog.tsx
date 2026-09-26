"use client";

import { useEffect, useState } from "react";
import {
  listOrgCampaigns,
  addLeadsToCampaign,
  type OrgCampaign,
} from "@/app/(dashboard)/dashboard/leads/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NEW_CAMPAIGN_VALUE = "__new__";

export function AddToCampaignDialog({
  open,
  onOpenChange,
  leadCount,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadCount: number;
  onSubmit: (input: Parameters<typeof addLeadsToCampaign>[1]) => Promise<void>;
}) {
  const [campaigns, setCampaigns] = useState<OrgCampaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [selected, setSelected] = useState<string>(NEW_CAMPAIGN_VALUE);
  const [newName, setNewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setNewName("");
    setIsLoadingCampaigns(true);
    listOrgCampaigns()
      .then((data) => {
        setCampaigns(data);
        setSelected(data.length > 0 ? data[0].id : NEW_CAMPAIGN_VALUE);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Couldn't load campaigns")
      )
      .finally(() => setIsLoadingCampaigns(false));
  }, [open]);

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      if (selected === NEW_CAMPAIGN_VALUE) {
        await onSubmit({ newCampaignName: newName });
      } else {
        await onSubmit({ campaignId: selected });
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    selected !== NEW_CAMPAIGN_VALUE || newName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Add {leadCount} {leadCount === 1 ? "lead" : "leads"} to a campaign
          </DialogTitle>
          <DialogDescription>
            Choose an existing campaign or start a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="campaign-select">Campaign</Label>
            <Select
              value={selected}
              onValueChange={(value: string | null) =>
                value && setSelected(value)
              }
            >
              <SelectTrigger id="campaign-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
                <SelectItem value={NEW_CAMPAIGN_VALUE}>
                  + Create new campaign
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selected === NEW_CAMPAIGN_VALUE && (
            <div className="space-y-1.5">
              <Label htmlFor="new-campaign-name">New campaign name</Label>
              <Input
                id="new-campaign-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Dentists — Karachi outreach"
                autoFocus
              />
            </div>
          )}

          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            onClick={handleSubmit}
            loading={isSubmitting || isLoadingCampaigns}
            disabled={!canSubmit}
          >
            Add to campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
