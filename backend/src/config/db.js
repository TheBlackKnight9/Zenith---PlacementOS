import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

/**
 * PrismaClient singleton instance to prevent multiple connections
 * during hot-reloading in development.
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    errorFormat: 'pretty'
  });
};

const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
