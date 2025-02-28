import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import logger from '../utils/logger.js';

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = {
                uid: decoded.uid,
                uoid: decoded.uoid || decoded.roleid_orgid,
                username: decoded.username,
                roleid: decoded.roleid,
                uaid: decoded.uaid
            };

            logger.debug('Token verified successfully', {
                uid: decoded.uid,
                path: req.path
            });

            next();
        } catch (error) {
            logger.error('Token verification failed', {
                error: error.message,
                token: token.substring(0, 10) + '...',
                path: req.path
            });
            throw new AppError('Invalid or expired token', 401);
        }
    } catch (error) {
        next(error);
    }
};

// Optional: Role-based authorization middleware
// const authorize = (...allowedRoles) => {
//     return (req, res, next) => {
//         try {
//             if (!req.user) {
//                 throw new AppError('User not authenticated', 401);
//             }

//             if (!allowedRoles.includes(req.user.roleid)) {
//                 logger.warn('Authorization failed: Invalid role', {
//                     uid: req.user.uid,
//                     roleid: req.user.roleid,
//                     requiredRoles: allowedRoles,
//                     path: req.path
//                 });
//                 throw new AppError('Not authorized to access this resource', 403);
//             }

//             next();
//         } catch (error) {
//             next(error);
//         }
//     };
// };

export { authMiddleware }; 