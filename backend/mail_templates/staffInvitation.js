const { renderBaseTemplate, escapeHtml } = require('./baseTemplate');

module.exports = ({ fullName, eventName, role, eventDate, eventLocation, email, password, loginUrl }) => {
  const bodyHtml = `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;">
      <p style="margin:0;font-size:14px;color:#334155;">Hello ${escapeHtml(fullName || 'Team Member')},</p>
      <p style="margin:10px 0 0;font-size:14px;color:#334155;">You were invited to support <strong>${escapeHtml(eventName || '')}</strong> as <strong>${escapeHtml((role || '').toUpperCase())}</strong>.</p>
      <p style="margin:10px 0 0;font-size:14px;color:#334155;"><strong>Date:</strong> ${escapeHtml(eventDate || '')}<br /><strong>Location:</strong> ${escapeHtml(eventLocation || '')}</p>
      <p style="margin:10px 0 0;font-size:14px;color:#334155;"><strong>Email:</strong> ${escapeHtml(email || '')}<br /><strong>Temporary Password:</strong> ${escapeHtml(password || '')}</p>
    </div>
  `;

  return {
    subject: `Staff Invitation: ${eventName || 'Event Assignment'}`,
    text: `You were invited as ${role} for ${eventName}. Login with ${email}.`,
    html: renderBaseTemplate({
      preheader: 'You have a new staff assignment',
      heading: 'Event Staff Invitation',
      intro: 'Your event access is ready. Please login and change your password after first sign in.',
      bodyHtml,
      ctaLabel: 'Login to DEMS',
      ctaUrl: loginUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
      supportEmail: process.env.SUPPORT_EMAIL
    })
  };
};

// Update for: feat(controlroom): build organizer control panel with dashboard UX
// Update for: feat(controlroom): create events, ticket tiers, and transactions schema indexes