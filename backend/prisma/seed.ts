import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { SeedOrganization, SeedData } from './interface-seed';

const prisma = new PrismaClient();

async function seedOrganization(org: SeedOrganization) {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: org.adminEmail },
  });

  if (existingAdmin) {
    console.log(
      `Skipped "${org.name}" — admin already exists: ${org.adminEmail} / ${org.adminPassword}`,
    );
    return;
  }

  const hashedPassword = await bcrypt.hash(org.adminPassword, 10);

  const organization = await prisma.organization.create({
    data: { name: org.name },
  });

  await prisma.user.create({
    data: {
      name: `${org.name} Admin`,
      email: org.adminEmail,
      password: hashedPassword,
      organizationId: organization.id,
      role: 'ADMIN',
    },
  });

  console.log(
    `Seeded "${org.name}" — admin login: ${org.adminEmail} / ${org.adminPassword}`,
  );
}

async function main() {
  const dataPath = path.join(__dirname, 'seed-data.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const seedData: SeedData = JSON.parse(raw);

  for (const org of seedData.organizations) {
    await seedOrganization(org);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
