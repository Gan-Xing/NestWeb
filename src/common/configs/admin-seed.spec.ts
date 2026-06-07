import { resolveAdminSeedConfig } from "./admin-seed";

describe("resolveAdminSeedConfig", () => {
  it("uses local defaults outside production", () => {
    expect(resolveAdminSeedConfig({ NODE_ENV: "development" })).toEqual({
      email: "admin@example.com",
      password: "admin123",
      username: "admin",
    });
  });

  it("requires explicit admin credentials in production", () => {
    expect(() => resolveAdminSeedConfig({ NODE_ENV: "production" })).toThrow(
      "ADMIN_EMAIL",
    );
  });

  it("rejects weak production admin passwords", () => {
    expect(() =>
      resolveAdminSeedConfig({
        NODE_ENV: "production",
        ADMIN_EMAIL: "ops@example.com",
        ADMIN_USERNAME: "ops-admin",
        ADMIN_PASSWORD: "admin123",
      }),
    ).toThrow("default or weak");
  });

  it("accepts explicit strong production admin credentials", () => {
    expect(
      resolveAdminSeedConfig({
        NODE_ENV: "production",
        ADMIN_EMAIL: "ops@example.com",
        ADMIN_USERNAME: "ops-admin",
        ADMIN_PASSWORD: "Admin1234.",
      }),
    ).toEqual({
      email: "ops@example.com",
      username: "ops-admin",
      password: "Admin1234.",
    });
  });
});
