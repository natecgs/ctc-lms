import nodemailer from 'nodemailer';

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASSWORD || 'your-app-password',
  },
});

export class EmailService {
  static async sendVerificationEmail(email: string, token: string, userName: string = 'Student'): Promise<boolean> {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .header { text-align: center; color: #0d9488; margin-bottom: 30px; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { color: #333; line-height: 1.6; margin-bottom: 30px; }
              .button { display: inline-block; background-color: #0d9488; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
              .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Email Verification</h1>
              </div>
              
              <div class="content">
                <p>Hello ${userName},</p>
                
                <p>Thank you for signing up! To complete your registration, please verify your email address by clicking the button below:</p>
                
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" class="button">Verify Email Address</a>
                </p>
                
                <p>Or copy and paste this link in your browser:</p>
                <p><code style="background-color: #f0f0f0; padding: 10px; display: block; word-break: break-all; margin: 10px 0;">
                  ${verificationUrl}
                </code></p>
                
                <p>This link will expire in 24 hours.</p>
                
                <p>If you didn't create this account, you can ignore this email.</p>
                
                <p>Best regards,<br/>
                The CTC LMS Team</p>
              </div>
              
              <div class="footer">
                <p>&copy; 2024 CTC Learning Management System. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;
      
      const plainTextContent = `
        Hello ${userName},

        Thank you for signing up! To complete your registration, please verify your email address by visiting the link below:

        ${verificationUrl}

        This link will expire in 24 hours.

        If you didn't create this account, you can ignore this email.

        Best regards,
        The CTC LMS Team
      `;

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@ctclms.com',
        to: email,
        subject: 'Verify Your Email Address - CTC LMS',
        html: htmlContent,
        text: plainTextContent,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('[EMAIL SERVICE] Verification email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('[EMAIL SERVICE] Error sending verification email:', error);
      return false;
    }
  }

  static async sendWelcomeEmail(email: string, userName: string = 'Student'): Promise<boolean> {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .header { text-align: center; color: #0d9488; margin-bottom: 30px; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { color: #333; line-height: 1.6; margin-bottom: 30px; }
              .button { display: inline-block; background-color: #0d9488; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
              .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to CTC LMS!</h1>
              </div>
              
              <div class="content">
                <p>Hello ${userName},</p>
                
                <p>Your email has been verified, and your account is now active. Welcome to our learning community!</p>
                
                <p>You can now:</p>
                <ul>
                  <li>Browse our course catalog</li>
                  <li>Enroll in courses</li>
                  <li>Track your progress</li>
                  <li>Earn certificates</li>
                </ul>
                
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">Go to Dashboard</a>
                </p>
                
                <p>If you have any questions, feel free to reach out to our support team.</p>
                
                <p>Happy learning!<br/>
                The CTC LMS Team</p>
              </div>
              
              <div class="footer">
                <p>&copy; 2024 CTC Learning Management System. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@ctclms.com',
        to: email,
        subject: 'Welcome to CTC LMS!',
        html: htmlContent,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('[EMAIL SERVICE] Welcome email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('[EMAIL SERVICE] Error sending welcome email:', error);
      return false;
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      await transporter.verify();
      console.log('[EMAIL SERVICE] SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('[EMAIL SERVICE] SMTP connection failed:', error);
      return false;
    }
  }
}
