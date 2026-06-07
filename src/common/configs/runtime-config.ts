type RuntimeEnv = NodeJS.ProcessEnv | Record<string, string | undefined>;
type MetricsRequestLike = {
  headers?: {
    authorization?: string;
  };
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
};

const insecureSecretValues = new Set([
  "defaultAccessSecret",
  "defaultRefreshSecret",
  "change-me-access-secret",
  "change-me-refresh-secret",
  "replace-with-a-long-random-secret",
]);

export function isProduction(env: RuntimeEnv = process.env) {
  return env.NODE_ENV === "production";
}

export function parseCsvEnv(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildCorsOrigin(env: RuntimeEnv = process.env) {
  if (env.CORS_ENABLED === "false") {
    return false;
  }

  const origins = parseCsvEnv(env.CORS_ORIGINS);
  if (origins.length > 0) {
    return origins;
  }

  return isProduction(env) ? false : true;
}

export function shouldSetupOpenApi(env: RuntimeEnv = process.env) {
  if (env.SWAGGER_ENABLED === "true") {
    return true;
  }

  return !isProduction(env) && env.SWAGGER_ENABLED !== "false";
}

export function validateRuntimeConfig(env: RuntimeEnv = process.env) {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }

  if (!isProduction(env)) {
    return;
  }

  assertSecureSecret("JWT_ACCESS_SECRET", env.JWT_ACCESS_SECRET);
  assertSecureSecret("JWT_REFRESH_SECRET", env.JWT_REFRESH_SECRET);

  if (env.CORS_ENABLED !== "false" && parseCsvEnv(env.CORS_ORIGINS).length === 0) {
    throw new Error("CORS_ORIGINS must be set in production, or CORS_ENABLED=false.");
  }
}

export function isMetricsRequestAllowed(
  request: MetricsRequestLike,
  env: RuntimeEnv = process.env,
) {
  if (env.METRICS_PUBLIC === "true") {
    return true;
  }

  const bearerToken = env.METRICS_BEARER_TOKEN;
  const authorization = request.headers?.authorization;
  if (bearerToken && authorization === `Bearer ${bearerToken}`) {
    return true;
  }

  const remoteAddress = request.socket?.remoteAddress ?? request.ip;
  return isPrivateOrLoopbackAddress(remoteAddress);
}

function assertSecureSecret(name: string, value?: string) {
  if (!value) {
    throw new Error(`${name} must be set in production.`);
  }

  if (insecureSecretValues.has(value) || value.length < 32) {
    throw new Error(`${name} must be a strong production secret.`);
  }
}

function isPrivateOrLoopbackAddress(address?: string) {
  const normalized = normalizeAddress(address);

  if (!normalized) {
    return false;
  }

  if (normalized === "::1" || normalized === "localhost") {
    return true;
  }

  const parts = normalized.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [first, second] = parts;

  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function normalizeAddress(address?: string) {
  if (!address) {
    return undefined;
  }

  if (address.startsWith("::ffff:")) {
    return address.slice("::ffff:".length);
  }

  return address;
}
