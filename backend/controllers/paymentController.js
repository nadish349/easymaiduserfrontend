import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Validate Stripe credentials before initializing
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('ERROR: Stripe credentials not found in environment variables');
  console.error('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Set' : 'Missing');
}

// Initialize Stripe
let stripe;
try {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia',
  });
  console.log('Stripe initialized successfully');
} catch (error) {
  console.error('ERROR: Failed to initialize Stripe:', error);
  throw error;
}

/**
 * Create Stripe payment intent
 * POST /api/payment/create-order
 * Body: { bookingId, amount, currency (optional) }
 */
export const createPaymentOrder = async (req, res) => {
  try {
    console.log('=== CREATE PAYMENT INTENT REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { bookingId, amount, currency = 'aed' } = req.body;

    // Validate input
    if (!bookingId) {
      console.error('Validation failed: Booking ID is missing');
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required',
        data: null
      });
    }

    if (!amount || amount <= 0) {
      console.error('Validation failed: Invalid amount:', amount);
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
        data: null
      });
    }

    // Validate Stripe credentials
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe credentials not configured');
      return res.status(500).json({
        success: false,
        message: 'Stripe credentials not configured',
        data: null
      });
    }

    // Check if Stripe is initialized
    if (!stripe) {
      console.error('Stripe instance not initialized');
      return res.status(500).json({
        success: false,
        message: 'Stripe not initialized',
        data: null
      });
    }

    // Create Stripe Payment Intent
    const paymentIntentData = {
      amount: Math.round(amount * 100), // Convert to smallest currency unit (fils for AED)
      currency: currency.toLowerCase(),
      metadata: {
        bookingId: bookingId
      },
      automatic_payment_methods: {
        enabled: true,
      },
    };

    console.log('Creating Stripe payment intent with data:', paymentIntentData);
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
    console.log('Stripe payment intent created successfully:', paymentIntent.id);

    return res.status(200).json({
      success: true,
      message: 'Payment intent created successfully',
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        bookingId: bookingId
      }
    });
  } catch (error) {
    console.error('=== ERROR IN CREATE PAYMENT INTENT ===');
    console.error('Error creating payment intent:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      secretKey: process.env.STRIPE_SECRET_KEY ? 'Set' : 'Missing'
    });
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment intent',
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Verify Stripe payment
 * POST /api/payment/verify
 * Body: { paymentIntentId, bookingId }
 */
export const verifyPayment = async (req, res) => {
  try {
    const { paymentIntentId, bookingId } = req.body;

    // Validate input
    if (!paymentIntentId || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'paymentIntentId and bookingId are required',
        data: null
      });
    }

    // Retrieve payment intent from Stripe to verify
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Check if payment was successful
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed',
        data: null
      });
    }

    // Payment verified successfully
    // Return success - the frontend will update Firestore
    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        bookingId: bookingId,
        paymentId: paymentIntent.id,
        paymentIntentId: paymentIntent.id,
        paymentStatus: 'paid'
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment',
      data: null
    });
  }
};

/**
 * Mark booking as Pay Later
 * POST /api/payment/pay-later
 * Body: { bookingId }
 */
export const markPayLater = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Validate input
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required',
        data: null
      });
    }

    // Return success - the frontend will update Firestore
    return res.status(200).json({
      success: true,
      message: 'Payment marked as due',
      data: {
        bookingId: bookingId,
        paymentStatus: 'due'
      }
    });
  } catch (error) {
    console.error('Error marking pay later:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark pay later',
      data: null
    });
  }
};

