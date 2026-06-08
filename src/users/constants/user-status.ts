export const USER_STATUS = {
  ACTIVE: "active",
  DISABLED: "disabled",
  RESIGNED: "resigned",
} as const;

export const USER_STATUS_VALUES = Object.values(USER_STATUS);

export type UserStatus = (typeof USER_STATUS_VALUES)[number];

export function normalizeUserStatus(status?: string | null): UserStatus {
  if (!status || status === "1" || status === "active") {
    return USER_STATUS.ACTIVE;
  }

  if (status === "0" || status === "resigned") {
    return USER_STATUS.RESIGNED;
  }

  if (status === "disabled") {
    return USER_STATUS.DISABLED;
  }

  return USER_STATUS.ACTIVE;
}

export function isUserActive(status?: string | null) {
  return normalizeUserStatus(status) === USER_STATUS.ACTIVE;
}
