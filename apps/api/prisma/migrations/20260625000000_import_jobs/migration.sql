-- CreateEnum
CREATE TYPE "ImportSource" AS ENUM ('MANUAL', 'WHATSAPP', 'OCR');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" TEXT NOT NULL,
    "source" "ImportSource" NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "rawContent" TEXT NOT NULL,
    "parsedContent" JSONB,
    "driverReportId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "import_jobs_driverReportId_key" ON "import_jobs"("driverReportId");

-- CreateIndex
CREATE INDEX "import_jobs_source_idx" ON "import_jobs"("source");

-- CreateIndex
CREATE INDEX "import_jobs_status_idx" ON "import_jobs"("status");

-- CreateIndex
CREATE INDEX "import_jobs_createdAt_idx" ON "import_jobs"("createdAt");

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_driverReportId_fkey" FOREIGN KEY ("driverReportId") REFERENCES "driver_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
