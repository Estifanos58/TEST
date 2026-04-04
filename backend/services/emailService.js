const { sendTemplateEmail } = require('./mailService');

const ensureSent = async (resultPromise) => {
  const result = await resultPromise;

  if (!result.success) {
    throw new Error(result.error || 'Email send failed');
  }

  return result;
};

const sendWelcomeEmail = async (user) => {
  return ensureSent(sendTemplateEmail({
    to: user.email,
    template: 'userRegistration',
    payload: {
      fullName: user.full_name,
      discoverUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/discover`
    }
  }));
};

const sendPasswordResetEmail = async (user, resetToken) => {
  return ensureSent(sendTemplateEmail({
    to: user.email,
    template: 'passwordReset',
    payload: {
      resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`
    }
  }));
};

const sendOrganizerApplicationReceivedEmail = async (user) => {
  return ensureSent(sendTemplateEmail({
    to: user.email,
    template: 'organizerApplicationReceived',
    payload: {
      fullName: user.full_name
    }
  }));
};

const sendAccountStatusEmail = async (user, status, reason = '') => {
  return ensureSent(sendTemplateEmail({
    to: user.email,
    template: 'accountStatus',
    payload: {
      fullName: user.full_name,
      status,
      reason,
      supportUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/support`
    }
  }));
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrganizerApplicationReceivedEmail,
  sendAccountStatusEmail
};
