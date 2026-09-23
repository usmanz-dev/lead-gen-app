import type { AuthError } from "@supabase/supabase-js";

export interface SignupErrorInfo {
  message: string;
  /** Set when the fix is to log in instead — the form renders a link to /login. */
  suggestLogin?: boolean;
}

/**
 * Maps Supabase Auth signup failures to specific, actionable copy. Never
 * falls through to a bare "something went wrong."
 */
export function getSignupErrorInfo(error: AuthError | Error): SignupErrorInfo {
  const message = error.message.toLowerCase();

  if (
    message.includes("already registered") ||
    message.includes("already exists") ||
    message.includes("already been registered")
  ) {
    return {
      message: "This email is already registered.",
      suggestLogin: true,
    };
  }

  if (message.includes("password")) {
    return {
      message:
        "That password doesn't meet the site's security requirements. Try a longer password with a mix of letters and numbers.",
    };
  }

  if (message.includes("rate limit") || message.includes("too many")) {
    return {
      message:
        "Too many signup attempts. Please wait a few minutes and try again.",
    };
  }

  if (message.includes("invalid") && message.includes("email")) {
    return { message: "That doesn't look like a valid email address." };
  }

  if (
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("failed to fetch")
  ) {
    return {
      message:
        "Couldn't reach the server. Check your internet connection and try again.",
    };
  }

  return {
    message: `We couldn't create your account (${error.message}). Please try again, or contact support if this keeps happening.`,
  };
}
