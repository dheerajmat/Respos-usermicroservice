import { authenticate, updateLoginTime, updateLogoutTime } from '../services/userLoginService.js';
import { AppError, ValidationError } from '../middleware/errorHandler.js';
import { serializeData } from '../utils/serializer.js';
import logger from '../utils/logger.js';

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ValidationError('Email and password are required');
        }

        // Convert email to lowercase
        const lowercaseEmail = email.toLowerCase();
        const result = await authenticate(lowercaseEmail, password);

        await updateLoginTime(result.data.ulid);

        logger.info('Login successful', { email });

        res.status(200).json(result);
    } catch (error) {
        logger.warn('Login failed', {
            error
        });
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        const { ulid } = req.body;

        if (!ulid) {
            throw new ValidationError('ulid is required');
        }

        await updateLogoutTime(ulid);

        res.status(200).json({
            message: 'Logout successful'
        })
    } catch (error) {
        logger.error('Logout failed', {
            ulid: req.body.ulid,
            error: error.message
        });
        next(error);

    }
}

export { login, logout };