import express from 'express';
import { sendBookingConfirmation } from '../controllers/bookingController.js';

const router = express.Router();

/**
 * POST /api/booking/confirmation
 * Send booking confirmation email to user and admin
 */
router.post('/confirmation', sendBookingConfirmation);

export default router;
