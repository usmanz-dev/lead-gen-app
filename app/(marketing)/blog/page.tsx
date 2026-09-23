import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Newspaper } from "lucide-react";

export const metadata: Metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
      <Reveal className="flex flex-col items-center">
        <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
          <Newspaper className="size-6" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          The blog is on its way
        </h1>
        <p className="text-muted-foreground mt-3 max-w-md">
          We&apos;re writing up local SEO tactics, cold outreach guides, and
          product updates. Nothing&apos;s published yet — check back soon, or
          get started with the product in the meantime.
        </p>
        <Button className="mt-8" render={<Link href="/signup" />}>
          Start Free Trial
        </Button>
      </Reveal>
    </section>
  );
}
