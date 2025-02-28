import logger from '../utils/logger.js';
import { Prisma } from '@prisma/client';

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
    }
}

class DataTypeError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DataTypeError';
        this.statusCode = 400;
    }
}

const errorHandler = (err, req, res, next) => {
    logger.error('Error:', { 
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errorType = err.name || 'UnknownError';
    let errorCode = err.code || 'INTERNAL_ERROR';
    let details = {};

    // Handle Prisma Errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002':
                statusCode = 400;
                message = 'Duplicate entry found';
                errorCode = 'UNIQUE_VIOLATION';
                break;
            case 'P2003':
                statusCode = 400;
                message = 'Referenced record not found';
                errorCode = 'FOREIGN_KEY_VIOLATION';
                break;
            case 'P2025':
                statusCode = 404;
                message = 'Record not found';
                errorCode = 'NOT_FOUND';
                break;
            default:
                statusCode = 500;
                message = 'Database error occurred';
                errorCode = 'DATABASE_ERROR';
        }
        details = {
            code: err.code,
            meta: err.meta
        };
    }
    else if (err instanceof ValidationError) {
        statusCode = 400;
        errorType = 'ValidationError';
        errorCode = 'VALIDATION_ERROR';
    }
    else if (err instanceof DataTypeError) {
        statusCode = 400;
        errorType = 'DataTypeError';
        errorCode = 'INVALID_DATA_TYPE';
    }
    else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ 
            message: 'Invalid JSON in request body'
        });
    }

    res.status(statusCode).json({
        error: {
            message,
            status: statusCode,
            type: errorType,
            code: errorCode,
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString(),
            ...(process.env.NODE_ENV !== 'production' && {
                stack: err.stack,
                details
            })
        }
    });
};

export { AppError, ValidationError, DataTypeError, errorHandler }; 