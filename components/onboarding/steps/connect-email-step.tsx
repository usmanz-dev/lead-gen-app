"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { connectSenderEmail } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Mail, MailCheck, Send } from "lucide-react";

const smtpSchema = z.object({
  emailAddress: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email"),
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.coerce
    .number()
    .int("Port must be a whole number")
    .min(1, "Port must be between 1 and 65535")
    .max(65535, "Port must be between 1 and 65535"),
  smtpUsername: z.string().min(1, "Username is required"),
  smtpPassword: z.string().min(1, "Password is required"),
});
type SmtpFormInput = z.input<typeof smtpSchema>;
type SmtpFormOutput = z.output<typeof smtpSchema>;

export function ConnectEmailStep({
  organizationId,
  connectedEmail,
  isSaving,
  onBack,
  onConnected,
  onNext,
}: {
  organizationId: string;
  connectedEmail: string | null;
  isSaving: boolean;
  onBack: () => void;
  onConnected: (email: string) => void;
  onNext: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SmtpFormInput, unknown, SmtpFormOutput>({
    resolver: zodResolver(smtpSchema),
    defaultValues: {
      emailAddress: "",
      smtpHost: "",
      smtpPort: 587,
      smtpUsername: "",
      smtpPassword: "",
    },
  });

  async function onSubmitSmtp(values: SmtpFormOutput) {
    setIsConnecting(true);
    setConnectError(null);
    try {
      await connectSenderEmail(organizationId, values);
      onConnected(values.emailAddress);
      setDialogOpen(false);
      reset();
    } catch (error) {
      setConnectError(
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Connect a sending email
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Connect the mailbox you&apos;ll send campaigns from. This is optional —
        you can always do this later from Sender Settings.
      </p>

      <div className="border-border bg-secondary/40 mt-6 rounded-xl border p-5">
        {connectedEmail ? (
          <div className="flex items-center gap-3">
            <div className="bg-success/10 text-success flex size-10 shrink-0 items-center justify-center rounded-full">
              <MailCheck className="size-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-semibold">Connected</div>
              <div className="text-muted-foreground text-sm">
                {connectedEmail}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-full">
              <Mail className="size-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-semibold">No email connected</div>
              <div className="text-muted-foreground text-sm">
                Connect via custom SMTP
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <Button
          type="button"
          variant="outline"
          className="mt-4 w-full"
          onClick={() => setDialogOpen(true)}
        >
          <Send className="size-4" aria-hidden="true" />
          {connectedEmail ? "Connect a different email" : "Connect Email"}
        </Button>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect a sending email</DialogTitle>
            <DialogDescription>
              Enter your mailbox&apos;s SMTP details. Credentials are encrypted
              before they&apos;re stored.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmitSmtp)}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="emailAddress">Email address</Label>
              <Input
                id="emailAddress"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.emailAddress}
                {...register("emailAddress")}
              />
              {errors.emailAddress && (
                <p className="text-destructive text-sm">
                  {errors.emailAddress.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="smtpHost">SMTP host</Label>
                <Input
                  id="smtpHost"
                  placeholder="smtp.example.com"
                  aria-invalid={!!errors.smtpHost}
                  {...register("smtpHost")}
                />
                {errors.smtpHost && (
                  <p className="text-destructive text-sm">
                    {errors.smtpHost.message}
                  </p>
                )}
              </div>
              <div className="w-24 space-y-1.5">
                <Label htmlFor="smtpPort">Port</Label>
                <Input
                  id="smtpPort"
                  inputMode="numeric"
                  aria-invalid={!!errors.smtpPort}
                  {...register("smtpPort")}
                />
                {errors.smtpPort && (
                  <p className="text-destructive text-sm">
                    {errors.smtpPort.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="smtpUsername">Username</Label>
              <Input
                id="smtpUsername"
                autoComplete="username"
                aria-invalid={!!errors.smtpUsername}
                {...register("smtpUsername")}
              />
              {errors.smtpUsername && (
                <p className="text-destructive text-sm">
                  {errors.smtpUsername.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="smtpPassword">Password</Label>
              <Input
                id="smtpPassword"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.smtpPassword}
                {...register("smtpPassword")}
              />
              {errors.smtpPassword && (
                <p className="text-destructive text-sm">
                  {errors.smtpPassword.message}
                </p>
              )}
            </div>

            {connectError && (
              <p className="text-destructive text-sm" role="alert">
                {connectError}
              </p>
            )}

            <DialogFooter>
              <Button type="submit" className="w-full" loading={isConnecting}>
                Connect
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="mt-8 flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          variant={connectedEmail ? "default" : "ghost"}
          className="flex-1"
          loading={isSaving}
          onClick={onNext}
        >
          {connectedEmail ? "Continue" : "Skip for now"}
        </Button>
      </div>
    </div>
  );
}
