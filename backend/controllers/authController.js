import { sendWelcomeEmail, sendLoginNotificationEmail } from '../services/emailService.js';

/**
 * Send welcome email when user creates first account
 * POST /api/auth/welcome
 * Body: { name, email, phone, customerId }
 */
export const sendWelcome = async (req, res) => {
  try {
    const { name, email, phone, customerId } = req.body;

    // Validate input
    if (!name || !email || !phone || !customerId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, phone, customerId',
        data: null
      });
    }

    // Send welcome email
    const result = await sendWelcomeEmail({ name, email, phone, customerId });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Welcome email sent successfully',
        data: result.result
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send welcome email',
        data: null,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in sendWelcome:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send welcome email',
      data: null
    });
  }
};

/**
 * Send login notification email
 * POST /api/auth/login-notification
 * Body: { name, email, phone }
 */
export const sendLoginNotification = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Validate input
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, phone',
        data: null
      });
    }

    // Send login notification email
    const loginTime = new Date().toLocaleString('en-US', { 
      timeZone: 'Asia/Dubai',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    const result = await sendLoginNotificationEmail({ 
      name, 
      email, 
      phone, 
      loginTime 
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Login notification sent successfully',
        data: result.result
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send login notification',
        data: null,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in sendLoginNotification:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send login notification',
      data: null
    });
  }
};
