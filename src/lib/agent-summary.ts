type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function extractStrings(value: JsonValue, bucket: string[]): void {
  if (value === null || value === undefined) {
    return;
  }
  if (typeof value === "string") {
    bucket.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => extractStrings(entry, bucket));
    return;
  }
  if (typeof value === "object") {
    Object.values(value).forEach((entry) => extractStrings(entry, bucket));
  }
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildAgentSummary(shades: JsonValue | null, softMemory: JsonValue | null): string {
  if (!shades && !softMemory) {
    return "";
  }

  const bucket: string[] = [];
  if (shades) {
    extractStrings(shades, bucket);
  }
  if (softMemory) {
    extractStrings(softMemory, bucket);
  }

  const tokens = bucket
    .map((entry) => normalizeText(entry))
    .filter(Boolean)
    .flatMap((entry) => entry.split(" "))
    .filter((token) => token.length >= 3);

  const unique = Array.from(new Set(tokens));
  return unique.slice(0, 24).join(" ");
}
