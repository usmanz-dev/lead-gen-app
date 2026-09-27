"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { WizardLeadPicker } from "@/components/dashboard/campaign-wizard/wizard-lead-picker";
import { WizardImportPicker } from "@/components/dashboard/campaign-wizard/wizard-import-picker";
import { WizardPastePicker } from "@/components/dashboard/campaign-wizard/wizard-paste-picker";

export function StepSelectLeads({
  selectedLeads,
  onAdd,
  onRemove,
  onNext,
}: {
  selectedLeads: Map<string, string>;
  onAdd: (lead: { id: string; name: string }) => void;
  onRemove: (id: string) => void;
  onNext: () => void;
}) {
  const [tab, setTab] = useState("list");

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Select Leads</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Pick from your existing leads, import a file, or paste a list.
      </p>

      <Tabs
        value={tab}
        onValueChange={(v: string | null) => v && setTab(v)}
        className="mt-6"
      >
        <TabsList>
          <TabsTrigger value="list">From Leads</TabsTrigger>
          <TabsTrigger value="import">Import File</TabsTrigger>
          <TabsTrigger value="paste">Paste List</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <WizardLeadPicker
            selectedIds={new Set(selectedLeads.keys())}
            onToggle={(lead, checked) =>
              checked ? onAdd(lead) : onRemove(lead.id)
            }
          />
        </TabsContent>

        <TabsContent value="import" className="mt-4">
          <WizardImportPicker onImported={(leads) => leads.forEach(onAdd)} />
        </TabsContent>

        <TabsContent value="paste" className="mt-4">
          <WizardPastePicker onImported={(leads) => leads.forEach(onAdd)} />
        </TabsContent>
      </Tabs>

      <div className="bg-muted/40 mt-6 rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {selectedLeads.size.toLocaleString()} lead
            {selectedLeads.size === 1 ? "" : "s"} selected
          </p>
          {selectedLeads.size > 0 && (
            <Badge variant="success">{selectedLeads.size} ready</Badge>
          )}
        </div>
        {selectedLeads.size > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Array.from(selectedLeads.entries())
              .slice(0, 12)
              .map(([id, name]) => (
                <Badge key={id} variant="secondary" className="gap-1">
                  {name}
                </Badge>
              ))}
            {selectedLeads.size > 12 && (
              <Badge variant="outline">+{selectedLeads.size - 12} more</Badge>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Button disabled={selectedLeads.size === 0} onClick={onNext}>
          Next: Compose Message
        </Button>
      </div>
    </div>
  );
}
