const DEFAULT_EXEC_EMAILS = ["projectlazarus@livia.io"];

function parseExecEmails(): Set<string> {
  const raw = process.env.EXPO_PUBLIC_PLATFORM_EXEC_EMAILS?.trim();
  const fromEnv = raw
    ? raw.split(/[,;\s]+/).map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];
  return new Set([...DEFAULT_EXEC_EMAILS.map((e) => e.toLowerCase()), ...fromEnv]);
}

export function isPlatformExecEmail(email: string | null | undefined): boolean {
  const normalized = (email ?? "").trim().toLowerCase();
  if (!normalized) return false;
  return parseExecEmails().has(normalized);
}
