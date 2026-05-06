export function normalizePreviewDomain(input: string): string | null {
  const trimmed = input.trim().toLowerCase().replace(/\.$/, "");

  if (!trimmed || trimmed.length > 253) {
    return null;
  }

  if (
    trimmed.includes("://") ||
    trimmed.includes("/") ||
    trimmed.includes("?") ||
    trimmed.includes("#") ||
    trimmed.includes(" ")
  ) {
    return null;
  }

  const labels = trimmed.split(".");

  if (labels.length < 2) {
    return null;
  }

  const isValid = labels.every(
    (label) =>
      label.length > 0 &&
      label.length <= 63 &&
      !label.startsWith("-") &&
      !label.endsWith("-") &&
      /^[a-z0-9-]+$/i.test(label)
  );

  return isValid ? trimmed : null;
}

export function parseBulkPreviewInput(value: string): {
  validDomains: string[];
  invalidDomains: string[];
} {
  const validDomains: string[] = [];
  const invalidDomains: string[] = [];
  const seen = new Set<string>();

  for (const entry of value.split(/[\n,]+/)) {
    const trimmed = entry.trim();

    if (!trimmed) {
      continue;
    }

    const normalized = normalizePreviewDomain(trimmed);

    if (!normalized) {
      invalidDomains.push(trimmed);
      continue;
    }

    if (!seen.has(normalized)) {
      seen.add(normalized);
      validDomains.push(normalized);
    }
  }

  return { validDomains, invalidDomains };
}
