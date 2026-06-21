import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function main() {
  console.log('Seeding database...');

  // ─── Users ──────────────────────────────────────────────────────────────────
  const [superAdminPw, ownerAPw, ownerBPw, managerPw, driverPw, driver2Pw, sharedDriverPw] =
    await Promise.all([
      bcrypt.hash('password123', BCRYPT_ROUNDS),
      bcrypt.hash('password123', BCRYPT_ROUNDS),
      bcrypt.hash('password123', BCRYPT_ROUNDS),
      bcrypt.hash('password123', BCRYPT_ROUNDS),
      bcrypt.hash('password123', BCRYPT_ROUNDS),
      bcrypt.hash('password123', BCRYPT_ROUNDS),
      bcrypt.hash('password123', BCRYPT_ROUNDS),
    ]);

  // SUPER_ADMIN — platform administrator
  const superAdmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      email: 'superadmin@hanbeyfleet.com',
      phone: '+90 500 000 0000',
      password: superAdminPw,
      name: 'Platform Admin',
      role: 'SUPER_ADMIN',
    },
  });

  // Fleet Owner A user
  const ownerAUser = await prisma.user.upsert({
    where: { username: 'cabir' },
    update: {},
    create: {
      username: 'cabir',
      email: 'owner@fleetA.com',
      phone: '+90 555 001 0001',
      password: ownerAPw,
      name: 'Cabir Han Beyoğlu',
      role: 'OWNER',
    },
  });

  // Fleet Owner B user
  const ownerBUser = await prisma.user.upsert({
    where: { username: 'mehmet' },
    update: {},
    create: {
      username: 'mehmet',
      email: 'owner@fleetB.com',
      phone: '+90 555 002 0002',
      password: ownerBPw,
      name: 'Mehmet Demir',
      role: 'OWNER',
    },
  });

  // Manager for Fleet A
  const managerUser = await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      email: 'manager@fleetA.com',
      phone: '+90 555 003 0003',
      password: managerPw,
      name: 'Ahmet Yönetici',
      role: 'MANAGER',
    },
  });

  // Driver 1 — belongs to Fleet A only
  const driverUser = await prisma.user.upsert({
    where: { username: 'ahmet_driver' },
    update: {},
    create: {
      username: 'ahmet_driver',
      email: 'driver1@fleetA.com',
      phone: '+90 555 123 4567',
      password: driverPw,
      name: 'Ahmet Şoför',
      role: 'DRIVER',
    },
  });

  // Driver 2 — belongs to Fleet B only
  const driverUser2 = await prisma.user.upsert({
    where: { username: 'ali_driver' },
    update: {},
    create: {
      username: 'ali_driver',
      email: 'driver2@fleetB.com',
      phone: '+90 555 987 6543',
      password: driver2Pw,
      name: 'Ali Kaya',
      role: 'DRIVER',
    },
  });

  // Shared Driver — BR-155: belongs to BOTH Fleet A and Fleet B
  const sharedDriverUser = await prisma.user.upsert({
    where: { username: 'shared_driver' },
    update: {},
    create: {
      username: 'shared_driver',
      email: 'shared@driver.com',
      phone: '+90 555 777 8888',
      password: sharedDriverPw,
      name: 'Hasan Çift Filo',
      role: 'DRIVER',
    },
  });

  // ─── Fleet Owners ────────────────────────────────────────────────────────────
  // BR-152: Fleet Owner is created with phone; phone is globally unique (BR-153)
  const fleetOwnerA = await prisma.fleetOwner.upsert({
    where: { phone: '+90 555 001 0001' },
    update: {},
    create: {
      name: 'Hanbey Filo A',
      phone: '+90 555 001 0001',
      email: 'info@fleetA.com',
      address: 'Kadıköy, İstanbul',
      taxNumber: '1234567890',
    },
  });

  const fleetOwnerB = await prisma.fleetOwner.upsert({
    where: { phone: '+90 555 002 0002' },
    update: {},
    create: {
      name: 'Hanbey Filo B',
      phone: '+90 555 002 0002',
      email: 'info@fleetB.com',
      address: 'Beşiktaş, İstanbul',
      taxNumber: '0987654321',
    },
  });

  // ─── Fleet Memberships ───────────────────────────────────────────────────────
  const createMembership = async (fleetOwnerId: string, userId: string, role: string) => {
    const existing = await prisma.fleetMembership.findUnique({
      where: { fleetOwnerId_userId: { fleetOwnerId, userId } },
    });
    if (!existing) {
      await prisma.fleetMembership.create({
        data: { fleetOwnerId, userId, role: role as any, status: 'ACTIVE' },
      });
    }
  };

  await createMembership(fleetOwnerA.id, ownerAUser.id, 'OWNER');
  await createMembership(fleetOwnerA.id, managerUser.id, 'MANAGER');
  await createMembership(fleetOwnerA.id, driverUser.id, 'DRIVER');
  // BR-155: Shared driver has membership in both fleets
  await createMembership(fleetOwnerA.id, sharedDriverUser.id, 'DRIVER');

  await createMembership(fleetOwnerB.id, ownerBUser.id, 'OWNER');
  await createMembership(fleetOwnerB.id, driverUser2.id, 'DRIVER');
  // BR-155: Shared driver also member of Fleet B
  await createMembership(fleetOwnerB.id, sharedDriverUser.id, 'DRIVER');

  // ─── Vehicles ────────────────────────────────────────────────────────────────
  // BR-151: Each vehicle belongs to exactly one fleet owner
  const vehicle = await (prisma.vehicle as any).upsert({
    where: { plate: '34 HBF 001' },
    update: { dailyFee: 5000, fleetOwnerId: fleetOwnerA.id },
    create: {
      plate: '34 HBF 001',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2022,
      color: 'White',
      status: 'IDLE',
      hgsTag: 'HGS-001234',
      dailyFee: 5000,
      fleetOwnerId: fleetOwnerA.id,
    },
  });

  const vehicle2 = await (prisma.vehicle as any).upsert({
    where: { plate: '34 HBF 002' },
    update: { dailyFee: 4500, fleetOwnerId: fleetOwnerA.id },
    create: {
      plate: '34 HBF 002',
      brand: 'Hyundai',
      model: 'i20',
      year: 2023,
      color: 'Black',
      status: 'IDLE',
      hgsTag: 'HGS-001235',
      dailyFee: 4500,
      fleetOwnerId: fleetOwnerA.id,
    },
  });

  // Fleet B vehicle
  const vehicle3 = await (prisma.vehicle as any).upsert({
    where: { plate: '34 HBF 003' },
    update: { dailyFee: 4800, fleetOwnerId: fleetOwnerB.id },
    create: {
      plate: '34 HBF 003',
      brand: 'Renault',
      model: 'Symbol',
      year: 2023,
      color: 'Silver',
      status: 'IDLE',
      hgsTag: 'HGS-001236',
      dailyFee: 4800,
      fleetOwnerId: fleetOwnerB.id,
    },
  });

  // ─── Driver Profiles ─────────────────────────────────────────────────────────
  let driver = await prisma.driver.findUnique({ where: { userId: driverUser.id } });
  if (!driver) {
    driver = await prisma.driver.create({
      data: {
        userId: driverUser.id,
        licenseNo: 'B-987654321',
        phone: '+90 555 123 4567',
        address: 'Kadıköy, İstanbul',
      },
    });
  }

  let driver2 = await prisma.driver.findUnique({ where: { userId: driverUser2.id } });
  if (!driver2) {
    driver2 = await prisma.driver.create({
      data: {
        userId: driverUser2.id,
        licenseNo: 'B-123456789',
        phone: '+90 555 987 6543',
        address: 'Beşiktaş, İstanbul',
      },
    });
  }

  // BR-154: Shared driver reuses same user account (no duplicate)
  let sharedDriver = await prisma.driver.findUnique({ where: { userId: sharedDriverUser.id } });
  if (!sharedDriver) {
    sharedDriver = await prisma.driver.create({
      data: {
        userId: sharedDriverUser.id,
        licenseNo: 'B-777888999',
        phone: '+90 555 777 8888',
        address: 'Üsküdar, İstanbul',
      },
    });
  }

  // ─── Expenses ────────────────────────────────────────────────────────────────
  const existingFuelExpense = await prisma.expense.findFirst({
    where: { vehicleId: vehicle.id, category: 'FUEL', note: 'Monthly fuel cost' },
  });
  if (!existingFuelExpense) {
    await prisma.expense.create({
      data: {
        vehicleId: vehicle.id,
        category: 'FUEL',
        amount: 500,
        expenseDate: new Date(),
        note: 'Monthly fuel cost',
      },
    });
  }

  const existingMaintenanceExpense = await prisma.expense.findFirst({
    where: { vehicleId: vehicle.id, category: 'MAINTENANCE', note: 'Oil change and filter' },
  });
  let maintenanceExpense = existingMaintenanceExpense;
  if (!maintenanceExpense) {
    maintenanceExpense = await prisma.expense.create({
      data: {
        vehicleId: vehicle.id,
        category: 'MAINTENANCE',
        amount: 850,
        expenseDate: new Date('2024-03-15'),
        note: 'Oil change and filter',
      },
    });
  }

  const existingMaintRec = await prisma.maintenanceRecord.findFirst({
    where: { vehicleId: vehicle.id, description: 'Oil change and filter replacement' },
  });
  if (!existingMaintRec) {
    await prisma.maintenanceRecord.create({
      data: {
        vehicleId: vehicle.id,
        expenseId: maintenanceExpense!.id,
        description: 'Oil change and filter replacement',
        cost: 850,
        date: new Date('2024-03-15'),
        mileage: 45000,
        serviceProvider: 'Toyota Yetkili Servis',
        nextMaintenanceMileage: 55000,
      },
    });
  }

  const existingBrakeMaint = await prisma.maintenanceRecord.findFirst({
    where: { vehicleId: vehicle.id, description: 'Front brake pad replacement' },
  });
  if (!existingBrakeMaint) {
    await prisma.maintenanceRecord.create({
      data: {
        vehicleId: vehicle.id,
        description: 'Front brake pad replacement',
        cost: 1200,
        date: new Date('2024-01-10'),
        mileage: 42000,
        serviceProvider: 'Bosch Car Service',
      },
    });
  }

  // ─── HGS Transits ───────────────────────────────────────────────────────────
  await prisma.hgsTransit.createMany({
    data: [
      {
        vehicleId: vehicle.id,
        transitTime: new Date('2024-06-20T08:15:00.000Z'),
        tollBooth: 'FSM',
        amount: 125.5,
        provider: 'ISBANK',
        referenceNo: 'HGS-SEED-001',
        syncedAt: new Date(),
      },
      {
        vehicleId: vehicle.id,
        transitTime: new Date('2024-06-20T14:30:00.000Z'),
        tollBooth: 'YSS',
        amount: 89.0,
        provider: 'ISBANK',
        referenceNo: 'HGS-SEED-002',
        syncedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  // ─── Completed Shift ─────────────────────────────────────────────────────────
  const existingCompletedShift = await prisma.shift.findFirst({
    where: { vehicleId: vehicle.id, status: 'COMPLETED', driverId: driver.id },
  });
  let completedShift = existingCompletedShift;
  if (!completedShift) {
    completedShift = await prisma.shift.create({
      data: {
        vehicleId: vehicle.id,
        driverId: driver.id,
        plannedStart: new Date('2024-06-19T03:00:00.000Z'),
        plannedEnd: new Date('2024-06-19T15:00:00.000Z'),
        actualStart: new Date('2024-06-19T03:00:00.000Z'),
        actualEnd: new Date('2024-06-19T15:00:00.000Z'),
        status: 'COMPLETED',
        type: 'DAY',
        openingMileage: 45000,
        closingMileage: 45120,
      },
    });
  }

  const existingDriverReport = await prisma.driverReport.findUnique({
    where: { shiftId: completedShift.id },
  });
  let driverReport = existingDriverReport;
  if (!driverReport) {
    driverReport = await prisma.driverReport.create({
      data: {
        shiftId: completedShift.id,
        declaredRevenue: 2500,
        declaredHgs: 214.5,
        declaredTotal: 2285.5,
        notes: 'Day shift settlement seed',
        isApproved: true,
        approvedById: ownerAUser.id,
        approvedAt: new Date(),
      },
    });
  }

  const existingShiftExpense = await prisma.expense.findFirst({
    where: { vehicleId: vehicle.id, shiftId: completedShift.id, category: 'FUEL' },
  });
  if (!existingShiftExpense) {
    await prisma.expense.create({
      data: {
        vehicleId: vehicle.id,
        shiftId: completedShift.id,
        category: 'FUEL',
        amount: 300,
        expenseDate: new Date('2024-06-19'),
        note: 'Shift fuel expense',
      },
    });
  }

  await prisma.hgsTransit.updateMany({
    where: { referenceNo: { in: ['HGS-SEED-001', 'HGS-SEED-002'] } },
    data: { shiftId: completedShift.id },
  });

  const existingSettlement = await prisma.settlement.findUnique({
    where: { shiftId: completedShift.id },
  });
  if (!existingSettlement) {
    await prisma.settlement.create({
      data: {
        shiftId: completedShift.id,
        driverReportId: driverReport.id,
        declaredRevenue: 2500,
        declaredHgs: 214.5,
        actualHgs: 214.5,
        expenses: 300,
        difference: 0,
        netRevenue: 1985.5,
        status: 'MATCHED',
      },
    });
  }

  await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: { currentMileage: 56000 },
  });

  // ─── Maintenance with warranty ───────────────────────────────────────────────
  const existingWarrantyMaint = await prisma.maintenanceRecord.findFirst({
    where: { vehicleId: vehicle2.id, description: 'Annual inspection with warranty' },
  });
  let warrantyMaintenance = existingWarrantyMaint;
  if (!warrantyMaintenance) {
    warrantyMaintenance = await prisma.maintenanceRecord.create({
      data: {
        vehicleId: vehicle2.id,
        description: 'Annual inspection with warranty',
        cost: 600,
        date: new Date(),
        mileage: 12000,
        serviceProvider: 'Hyundai Yetkili Servis',
        warrantyUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ─── Import Job ─────────────────────────────────────────────────────────────
  const existingImportableShift = await prisma.shift.findFirst({
    where: { vehicleId: vehicle2.id, driverId: driver.id, status: 'COMPLETED' },
  });
  let importableShift = existingImportableShift;
  if (!importableShift) {
    importableShift = await prisma.shift.create({
      data: {
        vehicleId: vehicle2.id,
        driverId: driver.id,
        plannedStart: new Date('2024-06-10T03:00:00.000Z'),
        plannedEnd: new Date('2024-06-10T15:00:00.000Z'),
        actualStart: new Date('2024-06-10T03:00:00.000Z'),
        actualEnd: new Date('2024-06-10T15:00:00.000Z'),
        status: 'COMPLETED',
        type: 'DAY',
        openingMileage: 11800,
        closingMileage: 11950,
      },
    });
  }

  const existingImportJob = await prisma.importJob.findFirst({
    where: { source: 'MANUAL', status: 'FAILED' },
  });
  if (!existingImportJob) {
    await prisma.importJob.create({
      data: {
        source: 'MANUAL',
        status: 'FAILED',
        rawContent: 'Gelir: 1500\nHGS: 80',
        parsedContent: { declaredRevenue: 1500, declaredHgs: 80 },
        error: 'Required fields could not be extracted: shift',
      },
    });
  }

  // ─── Documents ───────────────────────────────────────────────────────────────
  const existingInsuranceDoc = await prisma.document.findFirst({
    where: { ownerId: vehicle.id, type: 'INSURANCE' },
  });
  if (!existingInsuranceDoc) {
    await prisma.document.create({
      data: {
        ownerType: 'VEHICLE',
        ownerId: vehicle.id,
        title: 'Vehicle Insurance Policy',
        type: 'INSURANCE',
        issueDate: new Date('2024-01-01'),
        expiryDate: new Date('2025-06-01'),
        revisions: {
          create: {
            version: 1,
            fileName: 'insurance-policy-2024.pdf',
            fileUrl: 'https://storage.example.com/docs/insurance-policy-2024.pdf',
            mimeType: 'application/pdf',
            size: 245760,
          },
        },
      },
    });
  }

  const existingInspectionDoc = await prisma.document.findFirst({
    where: { ownerId: vehicle.id, type: 'INSPECTION' },
  });
  if (!existingInspectionDoc) {
    await prisma.document.create({
      data: {
        ownerType: 'VEHICLE',
        ownerId: vehicle.id,
        title: 'Annual Inspection Certificate',
        type: 'INSPECTION',
        issueDate: new Date(),
        expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        revisions: {
          create: {
            version: 1,
            fileName: 'inspection-2026.pdf',
            fileUrl: 'https://storage.example.com/docs/inspection-2026.pdf',
            mimeType: 'application/pdf',
            size: 98304,
          },
        },
      },
    });
  }

  const existingSrcDoc = await prisma.document.findFirst({
    where: { ownerId: driver.id, type: 'SRC_CERTIFICATE' },
  });
  if (!existingSrcDoc) {
    await prisma.document.create({
      data: {
        ownerType: 'DRIVER',
        ownerId: driver.id,
        title: 'Driver SRC Certificate',
        type: 'SRC_CERTIFICATE',
        issueDate: new Date('2023-06-01'),
        expiryDate: new Date('2025-12-01'),
        revisions: {
          create: {
            version: 1,
            fileName: 'src-certificate.pdf',
            fileUrl: 'https://storage.example.com/docs/src-certificate.pdf',
            mimeType: 'application/pdf',
            size: 156000,
          },
        },
      },
    });
  }

  // ─── Notifications ───────────────────────────────────────────────────────────
  const existingNotifications = await prisma.notification.findFirst({
    where: { userId: ownerAUser.id, type: 'MAINTENANCE_REMINDER' },
  });
  if (!existingNotifications) {
    await prisma.notification.createMany({
      data: [
        {
          userId: ownerAUser.id,
          title: 'Maintenance due',
          message: 'Vehicle 34 HBF 001 has reached 56000 km. Scheduled maintenance at 55000 km.',
          type: 'MAINTENANCE_REMINDER',
          metadata: {
            referenceId: 'seed-notification-maintenance',
            referenceType: 'maintenance',
            vehiclePlate: '34 HBF 001',
          },
        },
        {
          userId: ownerAUser.id,
          title: 'Warranty expiring soon',
          message: `Warranty for vehicle 34 HBF 002 expires within 30 days.`,
          type: 'WARRANTY_REMINDER',
          metadata: {
            referenceId: warrantyMaintenance!.id,
            referenceType: 'maintenance',
            vehiclePlate: '34 HBF 002',
          },
        },
        {
          userId: managerUser.id,
          title: 'Driver report missing',
          message: 'Shift for Ahmet Şoför on vehicle 34 HBF 002 completed without a driver report.',
          type: 'DRIVER_REPORT_MISSING',
          metadata: {
            referenceId: 'seed-notification-missing-report',
            referenceType: 'shift',
          },
        },
      ],
    });
  }

  // ─── Vehicle Assignments ─────────────────────────────────────────────────────
  const existingReleasedAssignment = await prisma.vehicleAssignment.findFirst({
    where: { vehicleId: vehicle.id, driverId: driver.id, releasedAt: { not: null } },
  });
  let releasedAssignment = existingReleasedAssignment;
  if (!releasedAssignment) {
    releasedAssignment = await prisma.vehicleAssignment.create({
      data: {
        vehicleId: vehicle.id,
        driverId: driver.id,
        assignedById: ownerAUser.id,
        assignedAt: new Date('2024-06-01T08:00:00.000Z'),
        releasedAt: new Date('2024-06-18T18:00:00.000Z'),
        releaseReason: 'Driver rotation — end of assignment period',
        notes: 'Initial assignment for vehicle commissioning',
      },
    });
  }

  const existingActiveAssignment1 = await prisma.vehicleAssignment.findFirst({
    where: { vehicleId: vehicle.id, driverId: driver.id, releasedAt: null },
  });
  if (!existingActiveAssignment1) {
    await prisma.vehicleAssignment.create({
      data: {
        vehicleId: vehicle.id,
        driverId: driver.id,
        assignedById: ownerAUser.id,
        notes: 'Regular day shift driver',
      },
    });
  }

  const existingActiveAssignment2 = await prisma.vehicleAssignment.findFirst({
    where: { vehicleId: vehicle2.id, driverId: driver2.id, releasedAt: null },
  });
  if (!existingActiveAssignment2) {
    await prisma.vehicleAssignment.create({
      data: {
        vehicleId: vehicle2.id,
        driverId: driver2.id,
        assignedById: managerUser.id,
        notes: 'Night shift driver',
      },
    });
  }

  // ─── Timeline Events ─────────────────────────────────────────────────────────
  await prisma.timelineEvent.createMany({
    data: [
      {
        vehicleId: vehicle.id,
        eventType: 'VEHICLE_CREATED',
        description: 'Vehicle 34 HBF 001 (Toyota Corolla 2022) registered — Fleet A',
      },
      {
        vehicleId: vehicle2.id,
        eventType: 'VEHICLE_CREATED',
        description: 'Vehicle 34 HBF 002 (Hyundai i20 2023) registered — Fleet A',
      },
      {
        vehicleId: vehicle3.id,
        eventType: 'VEHICLE_CREATED',
        description: 'Vehicle 34 HBF 003 (Renault Symbol 2023) registered — Fleet B',
      },
      {
        vehicleId: vehicle.id,
        eventType: 'VEHICLE_ASSIGNED',
        description: 'Vehicle 34 HBF 001 assigned to driver Ahmet Şoför (historical)',
        metadata: { assignmentId: releasedAssignment!.id, driverId: driver.id },
      },
      {
        vehicleId: vehicle.id,
        eventType: 'VEHICLE_RELEASED',
        description: 'Vehicle 34 HBF 001 released from driver Ahmet Şoför',
        metadata: {
          assignmentId: releasedAssignment!.id,
          releaseReason: releasedAssignment!.releaseReason,
        },
      },
    ],
    skipDuplicates: true,
  });

  console.log('');
  console.log('Database seeded successfully.');
  console.log('');
  console.log('Login credentials:');
  console.log('  SUPER_ADMIN:   superadmin / password123');
  console.log('  Fleet A Owner: cabir       / password123');
  console.log('  Fleet B Owner: mehmet      / password123');
  console.log('  Manager (A):   manager     / password123');
  console.log('  Driver 1 (A):  ahmet_driver / password123');
  console.log('  Driver 2 (B):  ali_driver   / password123');
  console.log('  Shared Driver: shared_driver / password123  (Fleet A + B — BR-155)');
  console.log('');
  console.log('Fleet Owners:');
  console.log(`  Fleet A: ${fleetOwnerA.id}`);
  console.log(`  Fleet B: ${fleetOwnerB.id}`);
  console.log('');
  console.log(`Import test shift (no report): ${importableShift!.id}`);

  void superAdmin;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
