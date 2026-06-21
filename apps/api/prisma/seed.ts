import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function main() {
  console.log('Seeding database...');

  const [ownerPassword, adminPassword, driverPassword] = await Promise.all([
    bcrypt.hash('password123', BCRYPT_ROUNDS),
    bcrypt.hash('password123', BCRYPT_ROUNDS),
    bcrypt.hash('password123', BCRYPT_ROUNDS),
  ]);

  const owner = await prisma.user.upsert({
    where: { username: 'cabir' },
    update: {},
    create: {
      username: 'cabir',
      email: 'owner@hanbeyfleet.com',
      password: ownerPassword,
      name: 'Fleet Owner',
      role: 'OWNER',
    },
  });

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@hanbeyfleet.com',
      password: adminPassword,
      name: 'Fleet Admin',
      role: 'ADMIN',
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { username: 'ahmet' },
    update: {},
    create: {
      username: 'ahmet',
      email: 'driver1@hanbeyfleet.com',
      password: driverPassword,
      name: 'Mehmet Yılmaz',
      role: 'DRIVER',
    },
  });

  const vehicle = await prisma.vehicle.upsert({
    where: { plate: '34 HBF 001' },
    update: {},
    create: {
      plate: '34 HBF 001',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2022,
      color: 'White',
      status: 'IDLE',
      hgsTag: 'HGS-001234',
    },
  });

  const vehicle2 = await prisma.vehicle.upsert({
    where: { plate: '34 HBF 002' },
    update: {},
    create: {
      plate: '34 HBF 002',
      brand: 'Hyundai',
      model: 'i20',
      year: 2023,
      color: 'Black',
      status: 'IDLE',
      hgsTag: 'HGS-001235',
    },
  });

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

  await prisma.expense.create({
    data: {
      vehicleId: vehicle.id,
      category: 'FUEL',
      amount: 500,
      expenseDate: new Date(),
      note: 'Monthly fuel cost',
    },
  });

  const maintenanceExpense = await prisma.expense.create({
    data: {
      vehicleId: vehicle.id,
      category: 'MAINTENANCE',
      amount: 850,
      expenseDate: new Date('2024-03-15'),
      note: 'Oil change and filter',
    },
  });

  await prisma.maintenanceRecord.create({
    data: {
      vehicleId: vehicle.id,
      expenseId: maintenanceExpense.id,
      description: 'Oil change and filter replacement',
      cost: 850,
      date: new Date('2024-03-15'),
      mileage: 45000,
      serviceProvider: 'Toyota Yetkili Servis',
      nextMaintenanceMileage: 55000,
    },
  });

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
  });

  const completedShift = await prisma.shift.create({
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

  const driverReport = await prisma.driverReport.create({
    data: {
      shiftId: completedShift.id,
      declaredRevenue: 2500,
      declaredHgs: 214.5,
      declaredTotal: 2285.5,
      notes: 'Day shift settlement seed',
      isApproved: true,
      approvedById: owner.id,
      approvedAt: new Date(),
    },
  });

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

  await prisma.hgsTransit.updateMany({
    where: { referenceNo: { in: ['HGS-SEED-001', 'HGS-SEED-002'] } },
    data: { shiftId: completedShift.id },
  });

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

  await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: { currentMileage: 56000 },
  });

  const warrantyMaintenance = await prisma.maintenanceRecord.create({
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

  const importableShift = await prisma.shift.create({
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

  await prisma.importJob.create({
    data: {
      source: 'MANUAL',
      status: 'FAILED',
      rawContent: 'Gelir: 1500\nHGS: 80',
      parsedContent: { declaredRevenue: 1500, declaredHgs: 80 },
      error: 'Required fields could not be extracted: shift',
    },
  });

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

  await prisma.notification.createMany({
    data: [
      {
        userId: owner.id,
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
        userId: owner.id,
        title: 'Warranty expiring soon',
        message: `Warranty for vehicle 34 HBF 002 expires within 30 days.`,
        type: 'WARRANTY_REMINDER',
        metadata: {
          referenceId: warrantyMaintenance.id,
          referenceType: 'maintenance',
          vehiclePlate: '34 HBF 002',
        },
      },
      {
        userId: admin.id,
        title: 'Driver report missing',
        message: 'Shift for Mehmet Yılmaz on vehicle 34 HBF 002 completed without a driver report.',
        type: 'DRIVER_REPORT_MISSING',
        metadata: {
          referenceId: 'seed-notification-missing-report',
          referenceType: 'shift',
        },
      },
    ],
  });

  await prisma.timelineEvent.createMany({
    data: [
      {
        vehicleId: vehicle.id,
        eventType: 'VEHICLE_CREATED',
        description: 'Vehicle 34 HBF 001 (Toyota Corolla 2022) registered',
      },
      {
        vehicleId: vehicle2.id,
        eventType: 'VEHICLE_CREATED',
        description: 'Vehicle 34 HBF 002 (Hyundai i20 2023) registered',
      },
    ],
    skipDuplicates: true,
  });

  console.log('');
  console.log('Database seeded successfully.');
  console.log('');
  console.log('Login credentials:');
  console.log('  Owner:  cabir / password123');
  console.log('  Admin:  admin / password123');
  console.log('  Driver: ahmet / password123');
  console.log('');
  console.log(`Import test shift (no report): ${importableShift.id}`);

  void owner;
  void admin;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
