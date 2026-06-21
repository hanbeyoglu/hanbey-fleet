-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('VEHICLE', 'DRIVER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('VEHICLE_LICENSE', 'REGISTRATION', 'INSURANCE', 'COMPREHENSIVE_INSURANCE', 'INSPECTION', 'EXHAUST_EMISSION', 'MUNICIPALITY_PERMIT', 'TAXI_PLATE_PERMIT', 'DRIVER_LICENSE', 'SRC_CERTIFICATE', 'PSYCHOTECHNIC_CERTIFICATE', 'CRIMINAL_RECORD', 'ID_CARD', 'CONTRACT');

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "ownerType" "OwnerType" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_revisions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "documents_ownerType_ownerId_idx" ON "documents"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "documents_type_idx" ON "documents"("type");

-- CreateIndex
CREATE INDEX "documents_expiryDate_idx" ON "documents"("expiryDate");

-- CreateIndex
CREATE INDEX "documents_deletedAt_idx" ON "documents"("deletedAt");

-- CreateIndex
CREATE INDEX "document_revisions_documentId_idx" ON "document_revisions"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "document_revisions_documentId_version_key" ON "document_revisions"("documentId", "version");

-- AddForeignKey
ALTER TABLE "document_revisions" ADD CONSTRAINT "document_revisions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
