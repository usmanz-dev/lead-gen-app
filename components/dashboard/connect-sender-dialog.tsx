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
  DialogClose,
} from "@/components/ui/dialog";

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

export function ConnectSenderDialog({
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function onSubmit(values: SmtpFormOutput) {
    setIsConnecting(true);
    setError(null);
    try {
      const { id } = await connectSenderEmail(organizationId, values);
      onConnected({ id, emailAddress: values.emailAddress });
      onOpenChange(false);
      reset();
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
          <DialogTitle>Connect a sending email</DialogTitle>
          <DialogDescription>
            Enter your mailbox&apos;s SMTP details. Credentials are encrypted
            before they&apos;re stored.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
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

          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" loading={isConnecting}>
              Connect
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
