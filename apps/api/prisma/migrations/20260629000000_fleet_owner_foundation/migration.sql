-- Sprint 016: Fleet Owner Foundation
-- Adds FleetOwner aggregate, FleetMembership, expands Role enum, adds phone to User,
-- and links Vehicle to FleetOwner.

-- CreateEnum: MembershipStatus
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable: Add phone to users (nullable + unique)
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateTable: fleet_owners
CREATE TABLE "fleet_owners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "taxNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "fleet_owners_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fleet_owners_phone_key" ON "fleet_owners"("phone");
CREATE INDEX "fleet_owners_phone_idx" ON "fleet_owners"("phone");

-- CreateTable: fleet_memberships
CREATE TABLE "fleet_memberships" (
    "id" TEXT NOT NULL,
    "fleetOwnerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fleet_memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fleet_memberships_fleetOwnerId_userId_key" ON "fleet_memberships"("fleetOwnerId", "userId");
CREATE INDEX "fleet_memberships_fleetOwnerId_idx" ON "fleet_memberships"("fleetOwnerId");
CREATE INDEX "fleet_memberships_userId_idx" ON "fleet_memberships"("userId");
CREATE INDEX "fleet_memberships_status_idx" ON "fleet_memberships"("status");

-- AlterTable: Add fleetOwnerId to vehicles
ALTER TABLE "vehicles" ADD COLUMN "fleetOwnerId" TEXT;
CREATE INDEX "vehicles_fleetOwnerId_idx" ON "vehicles"("fleetOwnerId");

-- AddForeignKey: fleet_memberships -> fleet_owners
ALTER TABLE "fleet_memberships" ADD CONSTRAINT "fleet_memberships_fleetOwnerId_fkey"
    FOREIGN KEY ("fleetOwnerId") REFERENCES "fleet_owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: fleet_memberships -> users
ALTER TABLE "fleet_memberships" ADD CONSTRAINT "fleet_memberships_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: vehicles -> fleet_owners
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_fleetOwnerId_fkey"
    FOREIGN KEY ("fleetOwnerId") REFERENCES "fleet_owners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
