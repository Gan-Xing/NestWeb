import {
  isSensitiveKey,
  redactSensitiveObject,
  redactSensitiveText,
  redactSensitiveUrl,
} from "./sensitive-data";

describe("sensitive data redaction", () => {
  it("detects common sensitive keys", () => {
    expect(isSensitiveKey("password")).toBe(true);
    expect(isSensitiveKey("refreshToken")).toBe(true);
    expect(isSensitiveKey("x-api-key")).toBe(true);
    expect(isSensitiveKey("username")).toBe(false);
  });

  it("redacts sensitive object fields recursively", () => {
    expect(
      redactSensitiveObject({
        email: "admin@example.com",
        password: "plain",
        nested: {
          refreshToken: "refresh-token",
          ok: true,
        },
      }),
    ).toEqual({
      email: "admin@example.com",
      password: "[REDACTED]",
      nested: {
        refreshToken: "[REDACTED]",
        ok: true,
      },
    });
  });

  it("redacts sensitive query params in URLs", () => {
    expect(
      redactSensitiveUrl("/api/auth/refresh?refreshToken=abc&next=/dashboard"),
    ).toBe("/api/auth/refresh?refreshToken=%5BREDACTED%5D&next=%2Fdashboard");
  });

  it("redacts sensitive text in error stacks", () => {
    expect(
      redactSensitiveText(
        "No user found for email: admin@example.com with Bearer abc.def",
      ),
    ).toBe("No user found for email: [REDACTED_EMAIL] with Bearer [REDACTED]");
  });
});
