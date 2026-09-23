import { Search, MapPin, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function EmptyDashboardState() {
  return (
    <div className="border-border flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center">
      <div className="relative flex size-24 items-center justify-center">
        <div
          aria-hidden="true"
          className="bg-primary/10 absolute inset-0 rounded-full"
        />
        <div
          aria-hidden="true"
          className="border-primary/20 absolute inset-2 rounded-full border-2 border-dashed"
        />
        <Search className="text-primary size-9" aria-hidden="true" />
        <MapPin
          className="text-success absolute -top-1 -right-1 size-6 rotate-12"
          aria-hidden="true"
        />
        <Building2
          className="text-muted-foreground absolute -bottom-1 -left-2 size-6 -rotate-12"
          aria-hidden="true"
        />
      </div>

      <h2 className="mt-6 text-lg font-semibold">
        Your lead pipeline starts here
      </h2>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
        Once Lead Search launches, your first results — scored, verified, and
        ready to contact — will show up right on this dashboard.
      </p>

      <div className="mt-6 flex items-center gap-2">
        <Button disabled>
          <Sparkles className="size-4" aria-hidden="true" />
          New Lead Search
        </Button>
        <Badge variant="outline">Coming soon</Badge>
      </div>
    </div>
  );
}
