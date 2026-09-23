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

export interface LoginErrorInfo {
  message: string;
  /** Set when the fix is to confirm their email — renders a "resend" hint. */
  suggestResendConfirmation?: boolean;
}

/**
 * Maps Supabase Auth login failures to copy. Wrong email vs. wrong password
 * deliberately collapse to one generic message — revealing which field was
 * incorrect would let an attacker enumerate registered emails. Every other
 * failure mode still gets a specific, actionable message.
 */
export function getLoginErrorInfo(error: AuthError | Error): LoginErrorInfo {
  const message = error.message.toLowerCase();

  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid email or password") ||
    (message.includes("invalid") && message.includes("credentials"))
  ) {
    return { message: "Incorrect email or password." };
  }

  if (
    message.includes("email not confirmed") ||
    message.includes("email_not_confirmed")
  ) {
    return {
      message: "Please confirm your email address before logging in.",
      suggestResendConfirmation: true,
    };
  }

  if (message.includes("rate limit") || message.includes("too many")) {
    return {
      message:
        "Too many login attempts. Please wait a few minutes and try again.",
    };
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
    message: `We couldn't log you in (${error.message}). Please try again, or contact support if this keeps happening.`,
  };
}

/**
 * Maps failures from resetPasswordForEmail(). Never used for "this email
 * isn't registered" — Supabase intentionally doesn't distinguish that case
 * (it returns success either way), which is exactly what keeps the
 * forgot-password flow from leaking which emails have accounts. Only real
 * system-level failures (rate limiting, bad connection) land here.
 */
export function getForgotPasswordErrorInfo(error: AuthError | Error): {
  message: string;
} {
  const message = error.message.toLowerCase();

  if (message.includes("rate limit") || message.includes("too many")) {
    return {
      message:
        "Too many reset attempts. Please wait a few minutes and try again.",
    };
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
    message: `We couldn't send the reset link (${error.message}). Please try again, or contact support if this keeps happening.`,
  };
}

export interface ResetPasswordErrorInfo {
  message: string;
  /** Set when the fix is to request a new link — the form links to /forgot-password. */
  linkExpired?: boolean;
}

export function getResetPasswordErrorInfo(
  error: AuthError | Error
): ResetPasswordErrorInfo {
  const message = error.message.toLowerCase();

  if (
    (message.includes("session") &&
      (message.includes("missing") ||
        message.includes("expired") ||
        message.includes("invalid"))) ||
    message.includes("otp") ||
    message.includes("token")
  ) {
    return {
      message: "This password reset link is invalid or has expired.",
      linkExpired: true,
    };
  }

  if (message.includes("password")) {
    return {
      message:
        "That password doesn't meet the site's security requirements. Try a longer password with a mix of letters and numbers.",
    };
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
    message: `We couldn't update your password (${error.message}). Please try again, or contact support if this keeps happening.`,
  };
}
