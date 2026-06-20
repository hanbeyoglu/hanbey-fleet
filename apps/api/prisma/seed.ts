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

  void owner;
  void admin;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
