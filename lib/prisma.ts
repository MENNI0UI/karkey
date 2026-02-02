import { PrismaClient } from '@prisma/client'

// Prevent multiple Prisma Client instances in development (HMR)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Connection pool and performance settings
// These help prevent connection pool exhaustion under load
const prismaClientOptions: ConstructorParameters<typeof PrismaClient>[0] = {
  log: process.env.NODE_ENV === 'development'
    ? [{ level: 'error', emit: 'stdout' }, { level: 'warn', emit: 'stdout' }]
    : [{ level: 'error', emit: 'stdout' }],
  // Datasource configuration can be extended via DATABASE_URL
  // For connection pooling, use PgBouncer or connection_limit in DATABASE_URL:
  // mysql://user:pass@host:port/db?connection_limit=10&pool_timeout=10
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions)

// Query timing is now available via the 'query' log level if needed
// Add { level: 'query', emit: 'stdout' } to the log array to enable

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma

