const { renderBaseTemplate, escapeHtml } = require('./baseTemplate');

module.exports = ({ fullName }) => {
  const safeName = escapeHtml(fullName || 'Organizer');

  const bodyHtml = `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;">
      <p style="margin:0;font-size:14px;color:#1d4ed8;">Hi ${safeName}, we received your organizer application successfully.</p>
      <p style="margin:10px 0 0;font-size:14px;color:#1e40af;">Our compliance team will review your details and send an update shortly.</p>
    </div>
  `;

  return {
    subject: 'Organizer Application Received',
    text: 'We received your organizer application and will notify you once review is complete.',
    html: renderBaseTemplate({
      preheader: 'Your organizer application is in review',
      heading: 'Application Received',
      intro: 'Thank you for applying as an organizer on DEMS.',
      bodyHtml,
      ctaLabel: 'View Account',
      ctaUrl: `${process.env.FRONTEND_URL}/login`,
      supportEmail: process.env.SUPPORT_EMAIL
    })
  };
};

// Update for: feat(controlroom): add organizer management UI and verification states
// Update for: feat(controlroom): implement financial core logic and platform fee calculation