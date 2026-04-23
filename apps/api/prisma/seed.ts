import { PrismaClient, Role, ShipmentStatus, CargoType, VehicleType, DriverVerificationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FreightFlow database...');

  const hash = (pw: string) => bcrypt.hash(pw, 12);

  // ─── Developer (super-admin, cannot be affected by admins) ──────────────
  const devHash = await hash('dev7863839084ihopeitssafe');
  const developer = await prisma.user.upsert({
    where: { email: 'dev7863839084@dev.trucker.com' },
    update: { passwordHash: devHash },
    create: {
      email: 'dev7863839084@dev.trucker.com',
      passwordHash: devHash,
      role: Role.DEVELOPER,
      emailVerified: true,
      profile: {
        create: { firstName: 'Developer', lastName: 'Account', company: 'FreightFlow' },
      },
    },
  });
  console.log('✅ Developer:', developer.email);

  // ─── Admin ───────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@freightflow.com' },
    update: {},
    create: {
      email: 'admin@freightflow.com',
      passwordHash: await hash('admin1234'),
      role: Role.ADMIN,
      emailVerified: true,
      profile: {
        create: { firstName: 'Admin', lastName: 'User', company: 'FreightFlow' },
      },
    },
  });
  console.log('✅ Admin:', admin.email);

  // ─── Shippers ─────────────────────────────────────────────────────────────
  const shipper1 = await prisma.user.upsert({
    where: { email: 'shipper@demo.com' },
    update: {},
    create: {
      email: 'shipper@demo.com',
      passwordHash: await hash('demo1234'),
      role: Role.SHIPPER,
      emailVerified: true,
      profile: {
        create: {
          firstName: 'Alice',
          lastName: 'Johnson',
          phone: '+1-555-0101',
          company: 'Johnson Imports LLC',
          city: 'Chicago',
          state: 'IL',
        },
      },
    },
  });

  const shipper2 = await prisma.user.upsert({
    where: { email: 'shipper2@demo.com' },
    update: {},
    create: {
      email: 'shipper2@demo.com',
      passwordHash: await hash('demo1234'),
      role: Role.SHIPPER,
      emailVerified: true,
      profile: {
        create: {
          firstName: 'Bob',
          lastName: 'Martinez',
          phone: '+1-555-0102',
          company: 'Martinez Wholesale',
          city: 'Los Angeles',
          state: 'CA',
        },
      },
    },
  });
  console.log('✅ Shippers created');

  // ─── Drivers ──────────────────────────────────────────────────────────────
  const driver1 = await prisma.user.upsert({
    where: { email: 'driver@demo.com' },
    update: {},
    create: {
      email: 'driver@demo.com',
      passwordHash: await hash('demo1234'),
      role: Role.DRIVER,
      emailVerified: true,
      profile: {
        create: {
          firstName: 'Carlos',
          lastName: 'Rivera',
          phone: '+1-555-0201',
          city: 'Dallas',
          state: 'TX',
        },
      },
      driverProfile: {
        create: {
          licenseNumber: 'DL-12345678',
          vehicleType: VehicleType.BOX_TRUCK,
          vehicleMake: 'Ford',
          vehicleModel: 'Transit',
          vehicleYear: 2021,
          vehiclePlate: 'TX-8823A',
          vehicleCapacityTons: 2.5,
          verificationStatus: DriverVerificationStatus.APPROVED,
          verifiedAt: new Date(),
          rating: 4.8,
          totalTrips: 47,
        },
      },
    },
  });

  const driver2 = await prisma.user.upsert({
    where: { email: 'driver2@demo.com' },
    update: {},
    create: {
      email: 'driver2@demo.com',
      passwordHash: await hash('demo1234'),
      role: Role.DRIVER,
      emailVerified: true,
      profile: {
        create: {
          firstName: 'Diana',
          lastName: 'Park',
          phone: '+1-555-0202',
          city: 'Atlanta',
          state: 'GA',
        },
      },
      driverProfile: {
        create: {
          vehicleType: VehicleType.SEMI_TRUCK,
          vehicleMake: 'Peterbilt',
          vehicleModel: '579',
          vehicleYear: 2020,
          vehiclePlate: 'GA-4491B',
          vehicleCapacityTons: 20,
          verificationStatus: DriverVerificationStatus.PENDING,
          rating: 4.6,
          totalTrips: 23,
        },
      },
    },
  });
  console.log('✅ Drivers created');

  // ─── Shipments ────────────────────────────────────────────────────────────
  const s1 = await prisma.shipment.upsert({
    where: { id: 'seed-shipment-1' },
    update: {},
    create: {
      id: 'seed-shipment-1',
      shipperId: shipper1.id,
      title: 'Office furniture from Chicago to Dallas',
      description: 'Moving office desks, chairs and filing cabinets for office relocation',
      status: ShipmentStatus.OPEN,
      cargoType: CargoType.GENERAL,
      weightKg: 800,
      pickupAddress: '123 North Michigan Ave',
      pickupCity: 'Chicago',
      pickupState: 'IL',
      pickupZip: '60601',
      pickupDate: new Date('2026-04-20T09:00:00Z'),
      deliveryAddress: '456 Commerce Street',
      deliveryCity: 'Dallas',
      deliveryState: 'TX',
      deliveryZip: '75201',
      budgetMin: 600,
      budgetMax: 1000,
      vehicleRequired: VehicleType.BOX_TRUCK,
      publishedAt: new Date(),
    },
  });

  const s2 = await prisma.shipment.upsert({
    where: { id: 'seed-shipment-2' },
    update: {},
    create: {
      id: 'seed-shipment-2',
      shipperId: shipper1.id,
      title: 'Electronics shipment — Chicago to New York',
      description: 'Packaged electronics (laptops, monitors). Fragile, needs careful handling.',
      status: ShipmentStatus.OPEN,
      cargoType: CargoType.ELECTRONICS,
      weightKg: 300,
      specialHandling: 'Fragile - handle with care. Do not stack.',
      pickupAddress: '789 West Adams St',
      pickupCity: 'Chicago',
      pickupState: 'IL',
      pickupDate: new Date('2026-04-22T10:00:00Z'),
      deliveryAddress: '321 Park Ave',
      deliveryCity: 'New York',
      deliveryState: 'NY',
      budgetMin: 800,
      budgetMax: 1400,
      publishedAt: new Date(),
    },
  });

  const s3 = await prisma.shipment.upsert({
    where: { id: 'seed-shipment-3' },
    update: {},
    create: {
      id: 'seed-shipment-3',
      shipperId: shipper2.id,
      title: 'Wholesale goods — LA to Phoenix',
      description: 'Pallets of consumer goods for retail distribution.',
      status: ShipmentStatus.BIDDING,
      cargoType: CargoType.GENERAL,
      weightKg: 5000,
      pickupAddress: '100 Industry Blvd',
      pickupCity: 'Los Angeles',
      pickupState: 'CA',
      pickupDate: new Date('2026-04-18T08:00:00Z'),
      deliveryAddress: '500 Distribution Dr',
      deliveryCity: 'Phoenix',
      deliveryState: 'AZ',
      budgetMin: 1200,
      budgetMax: 2000,
      vehicleRequired: VehicleType.SEMI_TRUCK,
      publishedAt: new Date(),
    },
  });

  const s4 = await prisma.shipment.upsert({
    where: { id: 'seed-shipment-4' },
    update: {},
    create: {
      id: 'seed-shipment-4',
      shipperId: shipper2.id,
      title: 'Refrigerated produce — LA to San Francisco',
      description: 'Fresh produce requiring temperature control throughout transit.',
      status: ShipmentStatus.OPEN,
      cargoType: CargoType.REFRIGERATED,
      weightKg: 2000,
      specialHandling: 'Keep refrigerated at 2-4°C',
      pickupAddress: '200 Market St',
      pickupCity: 'Los Angeles',
      pickupState: 'CA',
      pickupDate: new Date('2026-04-19T06:00:00Z'),
      deliveryAddress: '600 Ferry Terminal',
      deliveryCity: 'San Francisco',
      deliveryState: 'CA',
      budgetMin: 900,
      budgetMax: 1500,
      vehicleRequired: VehicleType.REFRIGERATED_TRUCK,
      publishedAt: new Date(),
    },
  });

  console.log('✅ Shipments created');

  // ─── Bids ─────────────────────────────────────────────────────────────────
  const driver1Profile = await prisma.driverProfile.findUnique({
    where: { userId: driver1.id },
  });

  await prisma.bid.upsert({
    where: { shipmentId_driverId: { shipmentId: s3.id, driverId: driver1.id } },
    update: {},
    create: {
      shipmentId: s3.id,
      driverId: driver1.id,
      amount: 1450,
      note: 'I have experience with wholesale freight. Can pickup next morning.',
      status: 'PENDING',
    },
  });

  await prisma.bid.upsert({
    where: { shipmentId_driverId: { shipmentId: s3.id, driverId: driver2.id } },
    update: {},
    create: {
      shipmentId: s3.id,
      driverId: driver2.id,
      amount: 1650,
      note: 'Large semi available. Can handle full pallet load.',
      status: 'PENDING',
    },
  });

  console.log('✅ Bids created');

  console.log('\n🎉 Seed complete!\n');
  console.log('Demo accounts:');
  console.log('  Developer: dev7863839084@dev.trucker.com / dev7863839084ihopeitssafe');
  console.log('  Admin:    admin@freightflow.com / admin1234');
  console.log('  Shipper:  shipper@demo.com / demo1234');
  console.log('  Shipper2: shipper2@demo.com / demo1234');
  console.log('  Driver:   driver@demo.com / demo1234');
  console.log('  Driver2:  driver2@demo.com / demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
