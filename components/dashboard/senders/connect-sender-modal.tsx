"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, CircleCheck, ExternalLink } from "lucide-react";
import { connectSenderEmail } from "@/app/onboarding/actions";
import { verifySmtpConnection } from "@/app/(dashboard)/dashboard/settings/senders/actions";
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
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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

export function ConnectSenderModal({
  organizationId,
  open,
  onOpenChange,
  onConnected,
}: {
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: (account: { id: string; emailAddress: string }) => void;
}) {
  const [tab, setTab] = useState("gmail");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [testPassed, setTestPassed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
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

  // Editing any field after a successful test invalidates it — we only
  // ever want to save credentials that were actually the ones verified.
  useEffect(() => {
    const subscription = watch(() => setTestPassed(false));
    return () => subscription.unsubscribe();
  }, [watch]);

  async function handleSendTest(values: SmtpFormOutput) {
    setError(null);
    setIsVerifying(true);
    try {
      await verifySmtpConnection(values);
      setTestPassed(true);
    } catch (err) {
      setTestPassed(false);
      setError(
        err instanceof Error ? err.message : "Couldn't verify this connection."
      );
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleConnect(values: SmtpFormOutput) {
    setError(null);
    setIsConnecting(true);
    try {
      const { id } = await connectSenderEmail(organizationId, values);
      onConnected({ id, emailAddress: values.emailAddress });
      onOpenChange(false);
      reset();
      setTestPassed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect New Sender</DialogTitle>
          <DialogDescription>
            Choose how you&apos;d like to send campaigns.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v: string | null) => v && setTab(v)}>
          <TabsList className="w-full">
            <TabsTrigger value="gmail" className="flex-1">
              Gmail / Workspace
            </TabsTrigger>
            <TabsTrigger value="smtp" className="flex-1">
              Custom SMTP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gmail" className="mt-4 space-y-4">
            <p className="text-muted-foreground text-sm">
              Sign in with Google to send from a Gmail or Workspace address.
              You&apos;ll be asked to grant access to send email on your behalf.
            </p>
            <Button
              className="w-full"
              render={<a href="/api/oauth/google/connect" />}
            >
              <Mail className="size-4" aria-hidden="true" />
              Continue with Google
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </Button>
          </TabsContent>

          <TabsContent value="smtp" className="mt-4">
            <form className="space-y-4" noValidate>
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

              {error && (
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
              )}
              {testPassed && !error && (
                <p className="text-success flex items-center gap-1.5 text-sm">
                  <CircleCheck className="size-4" aria-hidden="true" />
                  Test email sent — check your inbox, then connect.
                </p>
              )}

              <DialogFooter>
                <DialogClose
                  render={<Button type="button" variant="outline" />}
                >
                  Cancel
                </DialogClose>
                <Button
                  type="button"
                  variant="outline"
                  loading={isVerifying}
                  onClick={handleSubmit(handleSendTest)}
                >
                  Send Test Email
                </Button>
                <Button
                  type="button"
                  loading={isConnecting}
                  disabled={!testPassed}
                  onClick={handleSubmit(handleConnect)}
                >
                  Connect
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
