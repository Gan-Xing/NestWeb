type AdminSeedEnv = NodeJS.ProcessEnv | Record<string, string | undefined>;

const DEFAULT_ADMIN_EMAIL = "admin@example.com";
const DEFAULT_ADMIN_PASSWORD = "admin123";
const DEFAULT_ADMIN_USERNAME = "admin";

const weakProductionPasswords = new Set([
  DEFAULT_ADMIN_PASSWORD,
  "admin",
  "password",
  "password123",
  "qwerty123",
  "123456",
  "12345678",
  "replace-with-a-strong-admin-password",
]);

export type AdminSeedConfig = {
  email: string;
  password: string;
  username: string;
};

export function resolveAdminSeedConfig(
  env: AdminSeedEnv = process.env,
): AdminSeedConfig {
  const isProduction = env.NODE_ENV === "production";
  const email = readTextEnv(env.ADMIN_EMAIL) ?? (isProduction ? "" : DEFAULT_ADMIN_EMAIL);
  const password = readPasswordEnv(env.ADMIN_PASSWORD) ?? (isProduction ? "" : DEFAULT_ADMIN_PASSWORD);
  const username = readTextEnv(env.ADMIN_USERNAME) ?? (isProduction ? "" : DEFAULT_ADMIN_USERNAME);

  if (!email || !password || !username) {
    throw new Error(
      "ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_USERNAME must be set before running seed in production.",
    );
  }

  if (!isEmailLike(email)) {
    throw new Error("ADMIN_EMAIL must be a valid email address.");
  }

  if (isProduction && weakProductionPasswords.has(password)) {
    throw new Error("ADMIN_PASSWORD must not use a default or weak value in production.");
  }

  if (password.length < (isProduction ? 10 : 6)) {
    throw new Error(
      isProduction
        ? "ADMIN_PASSWORD must be at least 10 characters in production."
        : "ADMIN_PASSWORD must be at least 6 characters.",
    );
  }

  return { email, password, username };
}

function readTextEnv(value?: string) {
  const normalized = value?.trim();

  return normalized || undefined;
}

function readPasswordEnv(value?: string) {
  if (value === undefined) {
    return undefined;
  }

  return value.trim().length > 0 ? value : undefined;
}

function isEmailLike(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
