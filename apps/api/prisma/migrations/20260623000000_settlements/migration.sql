-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('MATCHED', 'MISMATCH', 'APPROVED');

-- CreateTable
CREATE TABLE "settlements" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "driverReportId" TEXT NOT NULL,
    "declaredRevenue" DECIMAL(12,2) NOT NULL,
    "declaredHgs" DECIMAL(10,2) NOT NULL,
    "actualHgs" DECIMAL(10,2) NOT NULL,
    "expenses" DECIMAL(12,2) NOT NULL,
    "difference" DECIMAL(10,2) NOT NULL,
    "netRevenue" DECIMAL(12,2) NOT NULL,
    "status" "SettlementStatus" NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settlements_shiftId_key" ON "settlements"("shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "settlements_driverReportId_key" ON "settlements"("driverReportId");

-- CreateIndex
CREATE INDEX "settlements_status_idx" ON "settlements"("status");

-- CreateIndex
CREATE INDEX "settlements_createdAt_idx" ON "settlements"("createdAt");

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_driverReportId_fkey" FOREIGN KEY ("driverReportId") REFERENCES "driver_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
