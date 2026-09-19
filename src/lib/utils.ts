export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function formatDate(iso: string | null, style: "long" | "short" = "long"): string {
  if (!iso) return "";
  return new Date(iso)
    .toLocaleDateString("en-GB", { day: "numeric", month: style === "long" ? "long" : "short", year: "numeric" })
    .toUpperCase();
}

export function excerpt(text: string, lines = 4): string {
  const all = text.split("\n");
  const cut = all.slice(0, lines).join("\n").trimEnd();
  return all.length > lines ? `${cut}…` : cut;
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function errorMessage(e: unknown, fallback = "Something went wrong."): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null && "message" in e) return String((e as { message: unknown }).message);
  return fallback;
}
