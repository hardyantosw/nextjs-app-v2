import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma2: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma2 ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma2 = db