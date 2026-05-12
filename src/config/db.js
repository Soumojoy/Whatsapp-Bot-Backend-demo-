const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

prisma.$connect()
  .then(() => console.log('[DB] ✅ Connected to PostgreSQL via Prisma'))
  .catch((err) => {
    console.error('[DB] ❌ Failed to connect to database:', err.message);
    console.error('[DB] Make sure DATABASE_URL is set correctly in .env');
  });

module.exports = prisma;
