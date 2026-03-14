# Email Verification Setup Guide

This document explains how to set up email verification for student sign-ups in the CTC LMS.

## Overview

Email verification is now implemented as part of the student sign-up flow. When a new student creates an account, they will:
1. Sign up with their email and password
2. See an email verification modal
3. Receive a verification email
4. Click the verification link or enter the code
5. Gain access to the dashboard after verification

## Backend Setup

### 1. Install Nodemailer

```bash
cd backend
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### 2. Database Schema

The email verification tables have already been added to `schema.sql`:
- `email_verification_tokens` table - stores verification tokens with 24-hour expiration
- `users` table updated with `email_verified` and `email_verified_at` fields

Run the migrations to create the tables:
```bash
npm run db:setup
```

### 3. Environment Variables

Update your `.env.local` file with email configuration:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@ctclms.com
FRONTEND_URL=http://localhost:5173
```

#### Using Gmail SMTP

1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password at https://myaccount.google.com/apppasswords
3. Select "Mail" and "Other (custom name)"
4. Use the 16-character password in `SMTP_PASSWORD`

#### Using Other Email Services

- **SendGrid**: Set `SMTP_HOST=smtp.sendgrid.net` and use your API key
- **Mailgun**: Set `SMTP_HOST=smtp.mailgun.org` and use your credentials
- **Office 365**: Set `SMTP_HOST=smtp.outlook.com` port 587
- **Custom SMTP**: Update the SMTP configuration accordingly

### 4. Email Service

The `EmailService` class in `backend/src/services/emailService.ts` handles:
- Sending verification emails with clickable links
- Sending welcome emails after successful verification
- Graceful error handling with try-catch blocks

## Frontend Setup

### 1. Email Verification Modal

The `EmailVerificationModal` component in `src/components/lms/EmailVerificationModal.tsx` provides:
- Displays email address being verified
- Shows verification code input field
- Resend functionality with 60-second cooldown
- Clear instructions and error handling

### 2. Verification Page

The `VerifyEmailPage` component in `src/pages/VerifyEmailPage.tsx` handles:
- Processing verification links from email
- Displaying success/error messages
- Auto-redirecting to home after successful verification

### 3. Context Functions

Added to `LMSContext`:
- `showEmailVerification` - Controls modal visibility
- `pendingVerificationUserId` - Stores user ID during verification
- `pendingVerificationEmail` - Stores email during verification
- `closeEmailVerification()` - Closes verification modal
- `completeEmailVerification()` - Completes verification and logs in user

## Backend API Endpoints

### POST `/api/users/send-verification-email`

Sends a verification email to the user.

**Request:**
```json
{
  "userId": 1,
  "email": "student@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

### POST `/api/users/verify-email-token`

Verifies the token from the email link.

**Request:**
```json
{
  "token": "uuid-token-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "id": 1,
    "email": "student@example.com",
    "email_verified": true,
    "email_verified_at": "2024-03-13T10:30:00Z"
  }
}
```

### GET `/api/users/:userId/verification-status`

Checks if a user's email is verified.

**Response:**
```json
{
  "success": true,
  "data": {
    "email_verified": true,
    "email_verified_at": "2024-03-13T10:30:00Z"
  }
}
```

## Database Schema Changes

### Users Table
```sql
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP;
```

### Email Verification Tokens Table
```sql
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);
```

## Features

✅ UUID-based verification tokens with 24-hour expiration
✅ Automatic token cleanup after verification
✅ Resend functionality with cooldown to prevent abuse
✅ HTML and plain text email templates
✅ Error handling and user-friendly messages
✅ Success email sent after verification
✅ Verification link in email and manual code entry options
✅ Mobile-friendly verification modal

## Testing

### Manual Testing

1. **Sign up a new student:**
   - Go to http://localhost:5173
   - Click "Create Account"
   - Fill in name, email, and password
   - Click "Create Account"

2. **Verify in modal:**
   - Enter verification code from email (or check logs for token)
   - Click "Verify Email"
   - Should see success message

3. **Verify via email link:**
   - Click the link in the email
   - Should be taken to verification page
   - Should be redirected to home after verification

### Testing Without SMTP

For development without email server:
1. Tokens are logged to console in `EmailService`
2. Check backend logs for token value
3. Use token in verification modal

Example log output:
```
[EMAIL SERVICE] Verification email token: 550e8400-e29b-41d4-a716-446655440000
```

## Troubleshooting

### Email not sending
- Check SMTP credentials in .env.local
- Verify FRONTEND_URL is correct
- Check Gmail App Password (not regular password)
- Look for error logs in backend console

### Token not found
- Token is 24-hour expiration, may have expired
- Check timezone settings
- Manually send new verification email via resend button

### User can't verify
- Check browser console for API errors
- Verify endpoint URLs match backend routes
- Check CORS settings if cross-origin issues

## Security Considerations

- Tokens are UUID v4 (cryptographically secure)
- Tokens expire after 24 hours
- Tokens are deleted after successful verification
- Email verification prevents spam signups
- Rate limiting recommended (not yet implemented)

## Future Enhancements

- [ ] Rate limiting on verification email sends
- [ ] Account lockout after X failed verification attempts
- [ ] Custom email templates from admin panel
- [ ] Batch verification email resends
- [ ] Verification reminder emails
- [ ] Two-factor authentication option
