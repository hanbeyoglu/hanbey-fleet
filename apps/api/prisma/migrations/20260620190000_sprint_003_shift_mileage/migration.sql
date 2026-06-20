-- Sprint 003: Vehicle currentMileage and Shift mileage fields

ALTER TABLE "vehicles" ADD COLUMN "currentMileage" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "shifts" ADD COLUMN "openingMileage" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "shifts" ADD COLUMN "closingMileage" INTEGER;
ALTER TABLE "shifts" ADD COLUMN "cancelReason" TEXT;
