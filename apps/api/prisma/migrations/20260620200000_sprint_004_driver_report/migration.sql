-- Sprint 004: DriverReport aggregate fields

ALTER TABLE "driver_reports" RENAME COLUMN "revenue" TO "declaredRevenue";

ALTER TABLE "driver_reports" ADD COLUMN "declaredTotal" DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE "driver_reports" ADD COLUMN "rawMessage" TEXT;
ALTER TABLE "driver_reports" ADD COLUMN "approvedById" TEXT;
ALTER TABLE "driver_reports" ADD COLUMN "cashRevenue" DECIMAL(12, 2);
ALTER TABLE "driver_reports" ADD COLUMN "cardRevenue" DECIMAL(12, 2);
ALTER TABLE "driver_reports" ADD COLUMN "posRevenue" DECIMAL(12, 2);
ALTER TABLE "driver_reports" ADD COLUMN "tips" DECIMAL(12, 2);
ALTER TABLE "driver_reports" ADD COLUMN "cashDelivered" DECIMAL(12, 2);

ALTER TABLE "driver_reports"
  ADD CONSTRAINT "driver_reports_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "driver_reports_isApproved_idx" ON "driver_reports"("isApproved");

-- Backfill declaredTotal from declaredRevenue for any existing rows
UPDATE "driver_reports" SET "declaredTotal" = "declaredRevenue" WHERE "declaredTotal" = 0;
