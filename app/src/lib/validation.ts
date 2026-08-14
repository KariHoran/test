export type ValidationStatus = "unknown" | "valid" | "invalid";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const GENERIC_LOCALS = new Set(["info", "sales", "contact", "office", "support", "hello", "admin", "mail"]);

export function isGenericEmailLocal(email: string): boolean {
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  return GENERIC_LOCALS.has(local);
}

export function validateEmail(email: string | null | undefined): ValidationStatus {
  if (!email?.trim()) return "unknown";
  const trimmed = email.trim();
  if (!EMAIL_RE.test(trimmed)) return "invalid";
  if (isGenericEmailLocal(trimmed)) return "invalid";
  return "valid";
}

export function validatePhone(phone: string | null | undefined): ValidationStatus {
  if (!phone?.trim()) return "unknown";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) return "valid";
  if (digits.length === 10) return "valid";
  return "invalid";
}

export function statusLabel(status: ValidationStatus): string {
  switch (status) {
    case "valid":
      return "валидный";
    case "invalid":
      return "битый";
    default:
      return "не проверен";
  }
}

export function isOutreachReady(c: {
  is_decision_maker: boolean;
  email_status: string;
  phone_status: string;
  email: string | null;
}): boolean {
  return (
    c.is_decision_maker &&
    c.email_status === "valid" &&
    c.phone_status === "valid" &&
    !isGenericEmailLocal(c.email ?? "")
  );
}
