import express from 'express';
import { sendWelcome, sendLoginNotification } from '../controllers/authController.js';

const router = express.Router();

/**
 * POST /api/auth/welcome
 * Send welcome email on first account creation
 */
router.post('/welcome', sendWelcome);

/**
 * POST /api/auth/login-notification
 * Send login notification email
 */
router.post('/login-notification', sendLoginNotification);

export default router;
