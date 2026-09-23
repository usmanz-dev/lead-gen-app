/**
 * Shared shell for the three legal pages (Terms, Privacy, Refund Policy).
 * Header/footer come from app/(marketing)/layout.tsx — this only owns the
 * single-column reading width, the heading, and the "Last updated" date.
 */
export function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-200 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Last updated {lastUpdated}
      </p>

      <div className="text-muted-foreground mt-10 space-y-8 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-foreground text-base font-semibold">{heading}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
