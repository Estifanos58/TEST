const { renderBaseTemplate, escapeHtml } = require('./baseTemplate');

module.exports = ({ fullName, discoverUrl }) => {
  const safeName = escapeHtml(fullName || 'there');
  const bodyHtml = `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;">
      <p style="margin:0 0 10px;font-size:14px;color:#334155;">Hello ${safeName},</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#334155;">
        Your account is now active. You can start discovering events, secure tickets, and manage your bookings from one dashboard.
      </p>
    </div>
  `;

  return {
    subject: 'Welcome to DEMS',
    text: `Welcome to DEMS, ${fullName || 'there'}. Your account is active and ready.`,
    html: renderBaseTemplate({
      preheader: 'Your DEMS account is ready',
      heading: 'Welcome to DEMS',
      intro: 'Thank you for registering. We are excited to have you on the platform.',
      bodyHtml,
      ctaLabel: 'Explore Events',
      ctaUrl: discoverUrl || `${process.env.FRONTEND_URL}/discover`,
      supportEmail: process.env.SUPPORT_EMAIL
    })
  };
};

// Update for: feat(controlroom): add draft/publish screens with validation UX
// Update for: feat(controlroom): build dashboard UI with KPI widgets and summaries
// Update for: feat(controlroom): implement search and filtering UI with state handling
// Update for: feat(controlroom): add payout history and reconciliation services
// Update for: feat(controlroom): implement search and filtering UI with state handling
// Update for: feat(controlroom): add event create/edit/publish APIs under /api/events