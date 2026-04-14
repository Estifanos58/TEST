const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL && process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
  const dbPassword = encodeURIComponent(process.env.DB_PASSWORD || '');
  process.env.DATABASE_URL = `postgresql://${process.env.DB_USER}:${dbPassword}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for Prisma connection');
}

const runtimeDatabaseUrl = process.env.DATABASE_URL.startsWith('postgres://')
  ? process.env.DATABASE_URL.replace(/^postgres:\/\//, 'postgresql://')
  : process.env.DATABASE_URL;

const pool = new Pool({ connectionString: runtimeDatabaseUrl });
const adapter = new PrismaPg(pool);
const DEFAULT_ROLES = ['admin', 'organizer', 'attendee', 'staff', 'security'];

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

const seedDefaultRoles = async () => {
  const roleCount = await prisma.role.count();

  if (roleCount > 0) {
    return;
  }

  await prisma.role.createMany({
    data: DEFAULT_ROLES.map((role_name) => ({ role_name }))
  });

  console.log('✅ Seeded default roles');
};

const connectDB = async () => {
  try {
    await prisma.$connect();
    await seedDefaultRoles();
    console.log('✅ Prisma database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed');
    console.error(error);

    if (error?.code) {
      console.error('Prisma error code:', error.code);
    }

    if (error?.meta) {
      console.error('Prisma error meta:', error.meta);
    }

    process.exit(1);
  }
};

const disconnectDB = async () => {
  await prisma.$disconnect();
  await pool.end();
};

module.exports = { prisma, connectDB, disconnectDB };
