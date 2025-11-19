import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  markPayLater
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.post('/pay-later', markPayLater);

export default router;




