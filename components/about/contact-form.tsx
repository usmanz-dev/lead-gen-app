"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactValues } from "@/lib/validations/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CircleCheck } from "lucide-react";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Honeypot value — kept outside react-hook-form so it's never a real
  // validated field, just a raw string read at submit time.
  const [honeypot, setHoneypot] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", message: "" },
  });

  async function onSubmit(values: ContactValues) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, company: honeypot }),
      });

      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;

      if (!response.ok || !data?.success) {
        setFormError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      setIsSuccess(true);
      reset();
    } catch {
      setFormError(
        "Couldn't reach the server. Check your internet connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="border-border bg-card rounded-xl border p-8 text-center">
        <div className="bg-success/10 text-success mx-auto flex size-11 items-center justify-center rounded-full">
          <CircleCheck className="size-5" aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Message sent</h3>
        <p className="text-muted-foreground mt-2 text-sm">
          Thanks for reaching out — we&apos;ll get back to you at your email
          soon.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => setIsSuccess(false)}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="border-border bg-card space-y-4 rounded-xl border p-6 sm:p-8"
      noValidate
    >
      {/* Honeypot field — visually hidden and out of tab order; real users
          never see or fill it, bots that auto-fill every input do. */}
      <div
        className="absolute h-0 w-0 overflow-hidden opacity-0"
        aria-hidden="true"
      >
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p id="name-error" className="text-destructive text-sm">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="text-destructive text-sm">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <textarea
          id="message"
          rows={5}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 w-full rounded-lg border bg-transparent px-2.5 py-2 text-sm transition-colors outline-none focus-visible:ring-3 aria-invalid:ring-3"
          {...register("message")}
        />
        {errors.message && (
          <p id="message-error" className="text-destructive text-sm">
            {errors.message.message}
          </p>
        )}
      </div>

      {formError && (
        <p className="text-destructive text-sm" role="alert">
          {formError}
        </p>
      )}

      <Button type="submit" className="w-full sm:w-auto" loading={isSubmitting}>
        Send message
      </Button>
    </form>
  );
}
