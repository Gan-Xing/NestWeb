# Permission Model

The current system is a single-tenant RBAC baseline. It does not yet implement
tenant isolation, organization trees, or row-level data permissions.

## Roles

`Role.code` is the stable system identity.

| Code | Name | Meaning |
| --- | --- | --- |
| `admin` | Display name, usually `系统管理员` | System administrator |
| `user` | Display name, usually `普通用户` | Default registered user |

Rules:

- Use `Role.code` for business logic.
- Treat `Role.name` as display text only.
- Do not check `role.name === "admin"`.
- Do not modify role `code` through update APIs.
- Protect the `admin` role by `code = "admin"`.

## Permissions

Permissions are identified by stable `Permission.code` values, such as:

- `dashboard.view`
- `auth.users.view`
- `auth.roles.update`
- `resources.images.upload`
- `system.logs.export`

Controllers declare required permissions with `@Permissions(...)`. The guard
allows access when the authenticated user has at least one required permission
through their roles. Admin users bypass the check.

## Menus And Permission Groups

Navigation is stored as permission groups and menus. The seed defines the
system-managed tree used by the frontend dynamic menu loader.

System-managed menu and permission codes live in:

```text
src/common/rbac/system-managed.ts
```

These records are protected from destructive admin UI changes because they are
maintained by code seed. Business-specific menus and permissions can still be
added outside the protected code list.

## Default Seed Behavior

`prisma/seed.ts`:

- upserts `admin` and `user` roles by `code`
- connects all system permissions to `admin`
- connects `dashboard.view` to `user`
- upserts the initial administrator account
- normalizes legacy permission aliases

Run seed deliberately. It is safe for system records, but it can overwrite
seed-managed display names and system-managed tree metadata.

## Current Boundary

This model is intentionally single tenant:

- No `tenantId`
- No organization tree
- No department-level data scope
- No per-record ownership policy except module-specific checks such as images

Add those only when P5 begins. Do not mix tenant/data-scope changes into the
current single-tenant baseline.
