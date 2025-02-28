import pkg from '@prisma/client';
import logger from '../utils/logger.js';

const { PrismaClient } = pkg;

const prisma = new PrismaClient();

prisma.$on('query', (e) => {
    logger.debug('Database query', {
        query: e.query,
        duration: e.duration + 'ms'
    });
});

// Handle Prisma-specific errors
prisma.$on('error', (e) => {
    logger.error('Database error', {
        error: e.message,
        target: e.target
    });
});

prisma.$on('info', (e) => {
    logger.info('Prisma Info', {
        message: e.message
    });
});

prisma.$on('warn', (e) => {
    logger.warn('Prisma Warning', {
        message: e.message
    });
});

export default prisma;