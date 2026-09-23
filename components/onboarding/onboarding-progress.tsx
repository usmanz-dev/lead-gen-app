export function OnboardingProgress({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  const percent = ((current + 1) / total) * 100;

  return (
    <div className="mb-8">
      <div className="text-muted-foreground mb-2 flex items-center justify-between text-xs font-medium">
        <span>
          Step {current + 1} of {total}
        </span>
        <span>{label}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={current + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Onboarding progress: step ${current + 1} of ${total}`}
        className="bg-border h-1.5 w-full overflow-hidden rounded-full"
      >
        <div
          className="bg-primary h-full rounded-full transition-[width] duration-300 ease-in-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
