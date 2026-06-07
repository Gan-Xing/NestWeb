ALTER TABLE "Role" ADD COLUMN "code" TEXT;

WITH generated AS (
  SELECT
    "id",
    CASE
      WHEN lower("name") = 'admin' THEN 'admin'
      WHEN lower("name") = 'user' THEN 'user'
      ELSE lower(regexp_replace("name", '[^a-zA-Z0-9]+', '_', 'g'))
    END AS "rawCode"
  FROM "Role"
)
UPDATE "Role" AS role
SET "code" = CASE
  WHEN generated."rawCode" IS NULL OR generated."rawCode" = '' THEN 'role_' || role."id"::text
  WHEN generated."rawCode" !~ '^[a-z]' THEN 'role_' || generated."rawCode"
  ELSE generated."rawCode"
END
FROM generated
WHERE role."id" = generated."id";

WITH ranked AS (
  SELECT
    "id",
    "code",
    row_number() OVER (PARTITION BY "code" ORDER BY "id") AS "rank"
  FROM "Role"
)
UPDATE "Role" AS role
SET "code" = role."code" || '_' || role."id"::text
FROM ranked
WHERE role."id" = ranked."id"
  AND ranked."rank" > 1;

ALTER TABLE "Role" ALTER COLUMN "code" SET NOT NULL;
DROP INDEX IF EXISTS "Role_name_key";
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");
CREATE INDEX "Role_name_idx" ON "Role"("name");
