import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TOTAL_CUSTOMERS = 100_000;
const BATCH_SIZE = 1_000;

async function main() {
  console.log('Creating performance-test organization...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const organization = await prisma.organization.create({
    data: { name: 'PerfTest Org' },
  });

  const admin = await prisma.user.create({
    data: {
      name: 'PerfTest Admin',
      email: 'admin@perftest.com',
      password: hashedPassword,
      organizationId: organization.id,
      role: 'ADMIN',
    },
  });

  console.log(`Org created: ${organization.id}`);
  console.log(`Admin login: admin@perftest.com / password123`);
  console.log(
    `Inserting ${TOTAL_CUSTOMERS} customers in batches of ${BATCH_SIZE}...`,
  );

  const startTime = Date.now();

  for (
    let batchStart = 0;
    batchStart < TOTAL_CUSTOMERS;
    batchStart += BATCH_SIZE
  ) {
    const batch = Array.from({ length: BATCH_SIZE }, (_, i) => {
      const index = batchStart + i;
      return {
        name: `Test Customer ${index}`,
        email: `customer${index}@perftest.com`,
        phone: `555-${String(index).padStart(7, '0')}`,
        organizationId: organization.id,
      };
    });

    await prisma.customer.createMany({ data: batch });

    if (batchStart % 10_000 === 0) {
      console.log(`  ...${batchStart} / ${TOTAL_CUSTOMERS} inserted`);
    }
  }

  const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `Done. Inserted ${TOTAL_CUSTOMERS} customers in ${elapsedSeconds}s.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
