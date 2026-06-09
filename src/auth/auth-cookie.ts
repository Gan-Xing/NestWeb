import type { Request, Response } from "express";

export const REFRESH_TOKEN_COOKIE_NAME = "nestweb_refresh_token";

const refreshTokenCookiePath = "/api/auth";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function shouldUseSecureCookie() {
  const configured = process.env.REFRESH_TOKEN_COOKIE_SECURE;
  if (configured === "true") {
    return true;
  }
  if (configured === "false") {
    return false;
  }
  return isProduction();
}

function getCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: shouldUseSecureCookie(),
    sameSite: "lax" as const,
    path: refreshTokenCookiePath,
    ...(typeof maxAge === "number" ? { maxAge } : {}),
  };
}

export function getRefreshTokenFromRequest(req: Request): string | undefined {
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) {
    return undefined;
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const prefix = `${REFRESH_TOKEN_COOKIE_NAME}=`;
  const rawValue = cookies.find((cookie) => cookie.startsWith(prefix));
  if (!rawValue) {
    return undefined;
  }

  const value = rawValue.slice(prefix.length);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
  refreshExpiresAt: number,
) {
  const maxAge = Math.max(refreshExpiresAt - Date.now(), 0);
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getCookieOptions(maxAge));
}

export function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getCookieOptions());
}
