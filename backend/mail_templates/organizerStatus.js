const { renderBaseTemplate, escapeHtml } = require('./baseTemplate');

module.exports = ({ fullName, status, reason, dashboardUrl }) => {
  const safeName = escapeHtml(fullName || 'Organizer');
  const safeStatus = escapeHtml(status || 'pending');

  const approved = status === 'approved';
  const intro = approved
    ? 'Great news. Your organizer account has been approved.'
    : 'Your organizer account review has been completed.';

  const bodyHtml = `
    <div style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:10px;padding:16px;">
      <p style="margin:0;font-size:14px;color:#155e75;">Hello ${safeName}, your organizer verification status is <strong>${safeStatus}</strong>.</p>
      ${
        reason
          ? `<p style="margin:10px 0 0;font-size:14px;color:#155e75;"><strong>Reviewer note:</strong> ${escapeHtml(reason)}</p>`
          : ''
      }
    </div>
  `;

  return {
    subject: approved ? 'Organizer Account Approved' : 'Organizer Account Review Update',
    text: approved
      ? 'Your organizer account has been approved. You can now create and manage events.'
      : `Your organizer account review result is ${status || 'updated'}. ${reason || ''}`,
    html: renderBaseTemplate({
      preheader: 'Organizer review result',
      heading: approved ? 'You are approved' : 'Organizer review update',
      intro,
      bodyHtml,
      ctaLabel: approved ? 'Open Organizer Dashboard' : 'Open Account',
      ctaUrl: dashboardUrl || `${process.env.FRONTEND_URL}/organizer/dashboard`,
      supportEmail: process.env.SUPPORT_EMAIL
    })
  };
};

// Update for: feat(controlroom): implement multi-step event wizard UI flow
// Update for: feat(controlroom): add draft/publish screens with validation UX