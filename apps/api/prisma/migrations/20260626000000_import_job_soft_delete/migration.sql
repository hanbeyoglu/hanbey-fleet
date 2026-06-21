-- AlterTable
ALTER TABLE "import_jobs" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "import_jobs_deletedAt_idx" ON "import_jobs"("deletedAt");
