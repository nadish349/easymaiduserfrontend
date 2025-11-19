import { sendBookingConfirmationEmail } from '../services/emailService.js';

/**
 * Send booking confirmation email to user and admin
 * POST /api/booking/confirmation
 * Body: { bookingData }
 */
export const sendBookingConfirmation = async (req, res) => {
  try {
    const bookingData = req.body;

    // Validate required fields
    const requiredFields = [
      'userId', 'customerId', 'userName', 'userEmail', 'userPhone',
      'bookingId', 'date', 'time', 'hours', 'professionals',
      'totalAmount', 'paymentStatus'
    ];

    const missingFields = requiredFields.filter(field => !bookingData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        data: null
      });
    }

    // Validate payment status
    if (!['paid', 'due'].includes(bookingData.paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status. Must be "paid" or "due"',
        data: null
      });
    }

    // Send booking confirmation email
    const result = await sendBookingConfirmationEmail(bookingData);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Booking confirmation emails sent successfully',
        data: {
          customerEmailSent: !!result.customerResult,
          adminEmailSent: !!result.adminResult
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send booking confirmation emails',
        data: null,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in sendBookingConfirmation:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send booking confirmation',
      data: null
    });
  }
};
