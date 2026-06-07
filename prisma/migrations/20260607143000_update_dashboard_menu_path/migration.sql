UPDATE "PermissionGroup"
SET "path" = '/dashboard',
    "icon" = 'DashboardOutlined'
WHERE "code" = 'dashboard';

UPDATE "permissions"
SET "path" = '/dashboard'
WHERE "code" = 'dashboard.view';
