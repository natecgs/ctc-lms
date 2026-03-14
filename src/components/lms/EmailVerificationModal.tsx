import React, { useState, useEffect } from 'react';
import { X, Mail, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface EmailVerificationModalProps {
  isOpen: boolean;
  email: string;
  userId: number;
  onClose: () => void;
  onVerified: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  email,
  userId,
  onClose,
  onVerified,
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleSendVerification = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/users/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send verification email');
        return;
      }

      setSuccessMessage('Verification email sent! Please check your inbox.');
      setResendCooldown(60); // 60 second cooldown
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error sending verification email:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/users/verify-email-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid verification code');
        return;
      }

      setSuccessMessage('Email verified successfully!');
      setTimeout(() => {
        onVerified();
        onClose();
      }, 1500);
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error verifying email:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Verify Your Email</h2>
          <p className="text-teal-100 text-sm mt-1">
            We've sent a verification link to your inbox
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Email Display */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">Verification sent to:</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{email}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl p-3 flex gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Verification Code Input */}
          <form onSubmit={handleVerifyToken} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter the code from your email"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Check your inbox and spam folder for the verification email
              </p>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || !verificationCode.trim()}
              className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Verify Email
            </button>
          </form>

          {/* Resend Button */}
          <button
            onClick={handleSendVerification}
            disabled={loading || resendCooldown > 0}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Send Verification Email'}
          </button>

          {/* Info Text */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500">
              <strong>Note:</strong> The verification link in your email will expire in 24 hours.
              If you don't see the email, check your spam folder or request a new one.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
