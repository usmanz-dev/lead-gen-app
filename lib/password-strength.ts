export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

/**
 * Lightweight heuristic strength meter — no need for a ~800KB zxcvbn
 * dependency just for a signup-form indicator.
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const capped = Math.min(score, 4) as PasswordStrength["score"];
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"];
  return { score: capped, label: labels[capped] };
}
