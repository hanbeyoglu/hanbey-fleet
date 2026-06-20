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
    where: { email: 'owner@hanbeyfleet.com' },
    update: {},
    create: {
      email: 'owner@hanbeyfleet.com',
      password: ownerPassword,
      name: 'Fleet Owner',
      role: 'OWNER',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hanbeyfleet.com' },
    update: {},
    create: {
      email: 'admin@hanbeyfleet.com',
      password: adminPassword,
      name: 'Fleet Admin',
      role: 'ADMIN',
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { email: 'driver1@hanbeyfleet.com' },
    update: {},
    create: {
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
  console.log('  Owner:  owner@hanbeyfleet.com / password123');
  console.log('  Admin:  admin@hanbeyfleet.com / password123');
  console.log('  Driver: driver1@hanbeyfleet.com / password123');

  void owner;
  void admin;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
