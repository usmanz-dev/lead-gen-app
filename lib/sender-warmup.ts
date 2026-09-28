// No "server-only" guard — the worker's live rate-limit check (see
// worker/processors/campaign-send.ts) uses the exact same ramp the app
// shows in the warm-up progress bar, so a sender's effective cap is never
// display-only.

export interface WarmupAccount {
  dailySendLimit: number;
  warmupEnabled: boolean;
  warmupStartedAt: string;
}

const WARMUP_TOTAL_DAYS = 14;

// A standard cold-email warm-up ramp: start low and roughly double every
// few days, reaching the account's full target by day 14. Real caps a
// worker enforces, not a cosmetic curve.
const RAMP_STEPS: Array<{ throughDay: number; cap: number }> = [
  { throughDay: 2, cap: 5 },
  { throughDay: 4, cap: 10 },
  { throughDay: 7, cap: 20 },
  { throughDay: 10, cap: 35 },
  { throughDay: WARMUP_TOTAL_DAYS, cap: Number.POSITIVE_INFINITY },
];

function dayNumberSince(iso: string): number {
  const elapsedMs = Date.now() - new Date(iso).getTime();
  return Math.floor(elapsedMs / (24 * 60 * 60 * 1000)) + 1;
}

/** The cap actually enforced right now — what launchCampaign schedules
 * against and what the worker rechecks live before every send. */
export function getEffectiveDailyLimit(account: WarmupAccount): number {
  if (!account.warmupEnabled) return account.dailySendLimit;

  const day = dayNumberSince(account.warmupStartedAt);
  if (day > WARMUP_TOTAL_DAYS) return account.dailySendLimit;

  const step = RAMP_STEPS.find((s) => day <= s.throughDay);
  const cap = step?.cap ?? account.dailySendLimit;
  return Math.min(cap, account.dailySendLimit);
}

export type WarmupPhase = "disabled" | "warming_up" | "completed";

export interface WarmupProgress {
  phase: WarmupPhase;
  dayNumber: number;
  totalDays: number;
  currentDailyLimit: number;
  targetDailyLimit: number;
  percent: number;
}

export function getWarmupProgress(account: WarmupAccount): WarmupProgress {
  const currentDailyLimit = getEffectiveDailyLimit(account);

  if (!account.warmupEnabled) {
    return {
      phase: "disabled",
      dayNumber: WARMUP_TOTAL_DAYS,
      totalDays: WARMUP_TOTAL_DAYS,
      currentDailyLimit,
      targetDailyLimit: account.dailySendLimit,
      percent: 100,
    };
  }

  const day = dayNumberSince(account.warmupStartedAt);
  const clampedDay = Math.min(Math.max(day, 1), WARMUP_TOTAL_DAYS);

  return {
    phase: day > WARMUP_TOTAL_DAYS ? "completed" : "warming_up",
    dayNumber: clampedDay,
    totalDays: WARMUP_TOTAL_DAYS,
    currentDailyLimit,
    targetDailyLimit: account.dailySendLimit,
    percent: Math.round((clampedDay / WARMUP_TOTAL_DAYS) * 100),
  };
}
