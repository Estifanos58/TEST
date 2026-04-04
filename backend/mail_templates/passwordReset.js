const { renderBaseTemplate } = require('./baseTemplate');

module.exports = ({ resetUrl }) => ({
  subject: 'Reset Your DEMS Password',
  text: `Use this link to reset your password: ${resetUrl}`,
  html: renderBaseTemplate({
    preheader: 'Password reset requested',
    heading: 'Reset Your Password',
    intro: 'We received a request to reset your password. This link will expire in 1 hour.',
    bodyHtml: '<p style="margin:0;font-size:14px;line-height:1.7;color:#334155;">If you did not request this change, you can ignore this email safely.</p>',
    ctaLabel: 'Reset Password',
    ctaUrl: resetUrl,
    supportEmail: process.env.SUPPORT_EMAIL
  })
});

// Update for: feat(controlroom): add dashboard navigation and layout coherence
// Update for: feat(controlroom): oversee control room integration and code reviews