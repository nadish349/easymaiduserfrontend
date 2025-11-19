import SibApiV3Sdk from '@sendinblue/client';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Brevo API client
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

/**
 * Send welcome email on first account creation
 * @param {Object} userData - User data { name, email, phone, customerId }
 */
export const sendWelcomeEmail = async (userData) => {
  try {
    const { name, email, phone, customerId } = userData;

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.sender = {
      name: process.env.SENDER_NAME,
      email: process.env.SENDER_EMAIL,
    };

    sendSmtpEmail.to = [{ email: email, name: name }];

    sendSmtpEmail.subject = 'Welcome to EasyMaid Cleaning Services! 🎉';

    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            h1 { margin: 0; font-size: 28px; }
            h2 { color: #667eea; }
            .highlight { background: #fff3cd; padding: 2px 6px; border-radius: 3px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 Welcome to EasyMaid!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your home cleaning partner</p>
            </div>
            <div class="content">
              <h2>Hello ${name}! 👋</h2>
              <p>Thank you for creating an account with <strong>EasyMaid Cleaning Services</strong>. We're excited to help you maintain a sparkling clean home!</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #667eea;">📋 Your Account Details</h3>
                <p><strong>Customer ID:</strong> <span class="highlight">${customerId}</span></p>
                <p><strong>Phone Number:</strong> ${phone}</p>
                <p><strong>Email:</strong> ${email}</p>
              </div>

              <h3>✨ What's Next?</h3>
              <ul>
                <li>Browse our professional cleaning services</li>
                <li>Schedule your first booking at your convenience</li>
                <li>Choose your preferred time slot and cleaning professionals</li>
                <li>Enjoy a spotless home without lifting a finger!</li>
              </ul>

              <div style="text-align: center;">
                <a href="https://easymaid.com" class="button">Start Booking Now</a>
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0; color: #667eea;">💡 Need Help?</h3>
                <p>Our support team is here for you! Reach out anytime:</p>
                <p>📧 Email: ${process.env.SENDER_EMAIL}<br>
                📱 Phone: ${phone}</p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} EasyMaid Cleaning Services. All rights reserved.</p>
              <p>You received this email because you created an account with us.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Welcome email sent successfully:', result);
    return { success: true, result };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send booking confirmation email to user and admin
 * @param {Object} bookingData - Booking data
 */
export const sendBookingConfirmationEmail = async (bookingData) => {
  try {
    const {
      userId,
      customerId,
      userName,
      userEmail,
      userPhone,
      bookingId,
      date,
      time,
      timeRange,
      hours,
      professionals,
      materials,
      totalAmount,
      originalAmount,
      discount,
      couponCode,
      paymentStatus,
      instructions,
      address,
    } = bookingData;

    const paymentStatusText = paymentStatus === 'paid' ? '✅ PAID' : '⏳ PAYMENT DUE';
    const paymentStatusColor = paymentStatus === 'paid' ? '#10b981' : '#f59e0b';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; color: white; background: ${paymentStatusColor}; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { color: #333; }
            .total-section { background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #667eea; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            h1 { margin: 0; font-size: 28px; }
            h2 { color: #667eea; margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Booking Confirmed!</h1>
              <p style="margin: 10px 0 0 0;">Booking ID: <strong>${bookingId}</strong></p>
            </div>
            <div class="content">
              <div style="text-align: center; margin: 20px 0;">
                <span class="status-badge">${paymentStatusText}</span>
              </div>

              <div class="booking-details">
                <h2>📅 Booking Details</h2>
                <div class="detail-row">
                  <span class="detail-label">Customer ID:</span>
                  <span class="detail-value">${customerId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Customer Name:</span>
                  <span class="detail-value">${userName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Phone:</span>
                  <span class="detail-value">${userPhone}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email:</span>
                  <span class="detail-value">${userEmail}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Address:</span>
                  <span class="detail-value">${address || 'Not provided'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${date}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">${timeRange || time}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Duration:</span>
                  <span class="detail-value">${hours} hour(s)</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Professionals:</span>
                  <span class="detail-value">${professionals}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Materials:</span>
                  <span class="detail-value">${materials ? 'Included' : 'Not included'}</span>
                </div>
                ${instructions ? `
                <div class="detail-row">
                  <span class="detail-label">Special Instructions:</span>
                  <span class="detail-value">${instructions}</span>
                </div>
                ` : ''}
              </div>

              <div class="total-section">
                <h2>💰 Payment Summary</h2>
                ${discount > 0 ? `
                <div class="detail-row">
                  <span class="detail-label">Original Amount:</span>
                  <span class="detail-value">AED ${originalAmount.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Discount ${couponCode ? `(${couponCode})` : ''}:</span>
                  <span class="detail-value" style="color: #10b981;">- AED ${discount.toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="detail-row" style="border-bottom: none; font-size: 18px;">
                  <span class="detail-label">Total Amount:</span>
                  <span class="detail-value" style="color: #667eea; font-size: 24px; font-weight: bold;">AED ${totalAmount.toFixed(2)}</span>
                </div>
                <div style="margin-top: 10px; padding-top: 10px; border-top: 2px solid #667eea;">
                  <span class="detail-label">Payment Status:</span>
                  <span class="status-badge" style="margin-left: 10px;">${paymentStatusText}</span>
                </div>
              </div>

              ${paymentStatus === 'due' ? `
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                <p style="margin: 0;"><strong>⚠️ Payment Pending</strong></p>
                <p style="margin: 5px 0 0 0;">Please complete the payment before the scheduled service date.</p>
              </div>
              ` : `
              <div style="background: #d1fae5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
                <p style="margin: 0;"><strong>✅ Payment Received</strong></p>
                <p style="margin: 5px 0 0 0;">Thank you for your payment. We're all set for your service!</p>
              </div>
              `}

              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #667eea; margin-top: 0;">📞 Need to Make Changes?</h3>
                <p>Contact us:</p>
                <p>📧 Email: ${process.env.SENDER_EMAIL}<br>
                📱 Phone: ${process.env.SENDER_EMAIL}</p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} EasyMaid Cleaning Services. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email to customer
    const customerEmail = new SibApiV3Sdk.SendSmtpEmail();
    customerEmail.sender = {
      name: process.env.SENDER_NAME,
      email: process.env.SENDER_EMAIL,
    };
    customerEmail.to = [{ email: userEmail, name: userName }];
    customerEmail.subject = `Booking Confirmation - ${paymentStatus === 'paid' ? 'Payment Received' : 'Payment Pending'} - ${bookingId}`;
    customerEmail.htmlContent = emailHtml;

    const customerResult = await apiInstance.sendTransacEmail(customerEmail);
    console.log('Booking confirmation email sent to customer:', customerResult);

    // Send email to admin
    const adminEmail = new SibApiV3Sdk.SendSmtpEmail();
    adminEmail.sender = {
      name: process.env.SENDER_NAME,
      email: process.env.SENDER_EMAIL,
    };
    adminEmail.to = [{ 
      email: process.env.ADMIN_EMAIL, 
      name: 'EasyMaid Admin' 
    }];
    adminEmail.subject = `New Booking - ${paymentStatus.toUpperCase()} - ${bookingId}`;
    adminEmail.htmlContent = emailHtml;

    const adminResult = await apiInstance.sendTransacEmail(adminEmail);
    console.log('Booking confirmation email sent to admin:', adminResult);

    return { 
      success: true, 
      customerResult, 
      adminResult 
    };
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send login notification email
 * @param {Object} userData - User data { name, email, phone, loginTime }
 */
export const sendLoginNotificationEmail = async (userData) => {
  try {
    const { name, email, phone, loginTime } = userData;

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.sender = {
      name: process.env.SENDER_NAME,
      email: process.env.SENDER_EMAIL,
    };

    sendSmtpEmail.to = [{ email: email, name: name }];

    sendSmtpEmail.subject = 'New Login to Your EasyMaid Account';

    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            h1 { margin: 0; font-size: 24px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 New Login Detected</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>We detected a new login to your EasyMaid account.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #667eea;">Login Details</h3>
                <p><strong>Time:</strong> ${loginTime}</p>
                <p><strong>Phone:</strong> ${phone}</p>
              </div>

              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>⚠️ Was this you?</strong></p>
                <p style="margin: 5px 0 0 0;">If you didn't log in, please contact us immediately at ${process.env.SENDER_EMAIL}</p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} EasyMaid Cleaning Services. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Login notification email sent successfully:', result);
    return { success: true, result };
  } catch (error) {
    console.error('Error sending login notification email:', error);
    return { success: false, error: error.message };
  }
};
