import {
  buildAuthThrottleRule,
  buildCorsOrigin,
  buildThrottlerOptions,
  isMetricsRequestAllowed,
  shouldSetupOpenApi,
  validateRuntimeConfig,
} from "./runtime-config";

describe("runtime security config", () => {
  it("requires production JWT secrets and explicit CORS origins", () => {
    expect(() =>
      validateRuntimeConfig({
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://example",
        JWT_ACCESS_SECRET: "change-me-access-secret",
        JWT_REFRESH_SECRET: "change-me-refresh-secret",
      }),
    ).toThrow("JWT_ACCESS_SECRET");

    expect(() =>
      validateRuntimeConfig({
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://example",
        JWT_ACCESS_SECRET: "a".repeat(32),
        JWT_REFRESH_SECRET: "b".repeat(32),
      }),
    ).toThrow("CORS_ORIGINS");
  });

  it("allows production startup with strong secrets and explicit origins", () => {
    expect(() =>
      validateRuntimeConfig({
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://example",
        JWT_ACCESS_SECRET: "a".repeat(32),
        JWT_REFRESH_SECRET: "b".repeat(32),
        CORS_ORIGINS: "https://admin.example.com",
      }),
    ).not.toThrow();
  });

  it("keeps dev OpenAPI on and production OpenAPI off by default", () => {
    expect(shouldSetupOpenApi({ NODE_ENV: "development" })).toBe(true);
    expect(shouldSetupOpenApi({ NODE_ENV: "production" })).toBe(false);
    expect(
      shouldSetupOpenApi({
        NODE_ENV: "production",
        SWAGGER_ENABLED: "true",
      }),
    ).toBe(true);
  });

  it("builds strict production CORS and permissive development CORS", () => {
    expect(buildCorsOrigin({ NODE_ENV: "development" })).toBe(true);
    expect(buildCorsOrigin({ NODE_ENV: "production" })).toBe(false);
    expect(
      buildCorsOrigin({
        NODE_ENV: "production",
        CORS_ORIGINS: "https://a.example.com, https://b.example.com",
      }),
    ).toEqual(["https://a.example.com", "https://b.example.com"]);
  });

  it("builds rate limit defaults with positive env overrides", () => {
    expect(buildAuthThrottleRule()).toEqual({
      limit: 10,
      ttl: 60_000,
    });
    expect(
      buildThrottlerOptions({
        RATE_LIMIT_MAX: "300",
        RATE_LIMIT_WINDOW_MS: "120000",
        AUTH_RATE_LIMIT_MAX: "6",
        AUTH_RATE_LIMIT_WINDOW_MS: "30000",
      }),
    ).toEqual([
      {
        name: "default",
        ttl: 120_000,
        limit: 300,
      },
    ]);
    expect(
      buildAuthThrottleRule({
        AUTH_RATE_LIMIT_MAX: "6",
        AUTH_RATE_LIMIT_WINDOW_MS: "30000",
      }),
    ).toEqual({
      limit: 6,
      ttl: 30_000,
    });
  });

  it("protects metrics from public clients while allowing private networks", () => {
    const request = (remoteAddress: string, authorization?: string) => ({
      headers: { authorization },
      socket: { remoteAddress },
    });

    expect(isMetricsRequestAllowed(request("172.20.0.5"))).toBe(true);
    expect(isMetricsRequestAllowed(request("127.0.0.1"))).toBe(true);
    expect(isMetricsRequestAllowed(request("8.8.8.8"))).toBe(false);
    expect(
      isMetricsRequestAllowed(request("8.8.8.8", "Bearer token"), {
        METRICS_BEARER_TOKEN: "token",
      }),
    ).toBe(true);
  });
});
