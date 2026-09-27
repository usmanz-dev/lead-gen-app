export const EMAIL_FORMAT_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_FORMAT_REGEX.test(email.trim());
}
