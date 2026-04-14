const { renderBaseTemplate, escapeHtml } = require('./baseTemplate');

const buildIntro = (status) => {
  if (status === 'suspended' || status === 'blocked') {
    return 'Your account access has been temporarily restricted.';
  }

  if (status === 'rejected') {
    return 'Your account request has been reviewed and could not be approved at this time.';
  }

  if (status === 'active') {
    return 'Your account access has been restored.';
  }

  return 'There has been an update to your account status.';
};

module.exports = ({ fullName, status, reason, supportUrl }) => {
  const safeName = escapeHtml(fullName || 'User');
  const safeStatus = escapeHtml(status || 'updated');
  const safeReason = reason ? `<p style="margin:10px 0 0;font-size:14px;color:#334155;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : '';

  const bodyHtml = `
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px;">
      <p style="margin:0;font-size:14px;color:#7c2d12;">Hello ${safeName}, your account status is now <strong>${safeStatus}</strong>.</p>
      ${safeReason}
      <p style="margin:10px 0 0;font-size:14px;color:#7c2d12;">If you believe this is an error, please contact support.</p>
    </div>
  `;

  return {
    subject: `Account Status Update: ${status || 'Updated'}`,
    text: `Your account status is now ${status || 'updated'}.${reason ? ` Reason: ${reason}` : ''}`,
    html: renderBaseTemplate({
      preheader: 'Important account status notification',
      heading: 'Account Status Update',
      intro: buildIntro(status),
      bodyHtml,
      ctaLabel: 'Contact Support',
      ctaUrl: supportUrl || `${process.env.FRONTEND_URL}/support`,
      supportEmail: process.env.SUPPORT_EMAIL
    })
  };
};

// Update for: feat(controlroom): build email notification service with templates
// Update for: feat(controlroom): add delivery retry and error handling for notifications
// Update for: feat(controlroom): implement financial core logic and platform fee calculation