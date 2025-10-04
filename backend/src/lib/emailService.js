import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or 'outlook', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD // Use App Password, not regular password
  }
});

// Generate verification token
export const generateVerificationToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Send verification email
export const sendVerificationEmail = async (email, verificationToken, userName) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: `"Recipe & DIY" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #fff7ed 0%, #ffe4e6 50%, #fce7f3 100%); padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #f97316; margin-bottom: 20px; font-size: 28px;">🎉 Welcome to Recipe & DIY!</h2>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${userName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for signing up! We're excited to have you join our community of food lovers and DIY enthusiasts.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Please verify your email address to get started and unlock all features:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); 
                      color: white; 
                      padding: 14px 40px; 
                      text-decoration: none; 
                      border-radius: 10px; 
                      display: inline-block;
                      font-weight: bold;
                      font-size: 16px;
                      box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);">
              ✉️ Verify Email
            </a>
          </div>
          <div style="background-color: rgba(255, 255, 255, 0.7); padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Or copy and paste this link:</p>
            <p style="color: #f97316; word-break: break-all; font-size: 13px; margin: 0;">${verificationUrl}</p>
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid rgba(249, 115, 22, 0.2);">
            <p style="color: #9ca3af; font-size: 13px; margin: 5px 0;">
              ⏰ This link will expire in 24 hours.
            </p>
            <p style="color: #9ca3af; font-size: 13px; margin: 5px 0;">
              🔒 If you didn't create an account, please ignore this email.
            </p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; padding: 15px;">
          <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
            © 2025 Recipe & DIY. All rights reserved.
          </p>
        </div>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send welcome email after verification
export const sendWelcomeEmail = async (email, userName) => {
  const mailOptions = {
    from: `"Recipe & DIY" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎊 Welcome to Recipe & DIY Community!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #fff7ed 0%, #ffe4e6 50%, #fce7f3 100%); padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #f97316; margin-bottom: 20px; font-size: 28px;">🎊 Welcome Aboard, ${userName}!</h2>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Your email has been verified successfully! You're now part of our amazing community.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Here's what you can do:
          </p>
          <ul style="color: #374151; font-size: 15px; line-height: 1.8;">
            <li>📝 Share your favorite recipes and DIY projects</li>
            <li>💬 Connect with other food lovers and crafters</li>
            <li>💰 Compare prices and find the best deals</li>
            <li>🤖 Get personalized suggestions from our AI Assistant</li>
            <li>📍 Discover local content and vendors near you</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}" 
               style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); 
                      color: white; 
                      padding: 14px 40px; 
                      text-decoration: none; 
                      border-radius: 10px; 
                      display: inline-block;
                      font-weight: bold;
                      font-size: 16px;
                      box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);">
              🚀 Start Exploring
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 20px;">
            Happy cooking and crafting! 🍳🎨
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; padding: 15px;">
          <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
            © 2025 Recipe & DIY. All rights reserved.
          </p>
        </div>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error here as it's not critical
  }
};
