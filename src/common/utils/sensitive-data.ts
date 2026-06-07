const REDACTED = "[REDACTED]";

const sensitiveKeyPatterns = [
  /authorization/i,
  /cookie/i,
  /password/i,
  /passwd/i,
  /secret/i,
  /token/i,
  /refresh/i,
  /access[_-]?token/i,
  /api[_-]?key/i,
  /captcha/i,
  /^code$/i,
  /hashedRt/i,
];

export function redactSensitiveUrl(url: string | undefined) {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url, "http://nestweb.local");
    parsed.searchParams.forEach((_, key) => {
      if (isSensitiveKey(key)) {
        parsed.searchParams.set(key, REDACTED);
      }
    });

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

export function redactSensitiveObject<T>(value: T, depth = 0): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (depth > 4) {
    return REDACTED as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveObject(item, depth + 1)) as T;
  }

  if (typeof value !== "object") {
    return value;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    sanitized[key] = isSensitiveKey(key)
      ? REDACTED
      : redactSensitiveObject(item, depth + 1);
  }

  return sanitized as T;
}

export function redactSensitiveText(value: string | undefined) {
  if (!value) {
    return value;
  }

  return value
    .replace(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      "[REDACTED_EMAIL]",
    )
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/-]+=*/g, "$1[REDACTED]");
}

export function isSensitiveKey(key: string) {
  return sensitiveKeyPatterns.some((pattern) => pattern.test(key));
}
