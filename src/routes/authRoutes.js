import express from 'express';
import { login, logout } from '../controllers/userLoginController.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           description: User's email address
 *           example: superadmin@respos.com
 *         password:
 *           type: string
 *           description: User's password
 *           example: 123456
 *     LoginResponse:
 *       type: object
 *       properties:
 *         uid:
 *           type: integer
 *           description: User ID
 *         uoid:
 *           type: integer
 *           description: User organization ID
 *         username:
 *           type: string
 *           description: Username (email or other unique identifier)
 *         roleid:
 *           type: integer
 *           description: User's role ID
 *         roleid_orgid:
 *           type: integer
 *           description: Organization role ID
 *         token:
 *           type: string
 *           description: JWT token
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

/**
 * @swagger
 * /api/v2/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', login);

/**
 * @swagger
 * /api/v2/auth/logout:
 *   post:
 *     summary: Log out a user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ulid
 *             properties:
 *               ulid:
 *                 type: integer
 *                 description: User login ID
 *     responses:
 *       200:
 *         description: Successful logout
 *       500:
 *         description: Server error
 */
router.post('/logout', logout);


export default router;