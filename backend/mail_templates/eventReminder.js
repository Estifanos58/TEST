const { renderBaseTemplate, escapeHtml } = require('./baseTemplate');

module.exports = ({ fullName, eventName, eventDateTime, venueName, city, myTicketsUrl }) => {
  const bodyHtml = `
    <div style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:10px;padding:16px;">
      <p style="margin:0;font-size:14px;color:#0c4a6e;">Hi ${escapeHtml(fullName || '')}, this is your reminder for <strong>${escapeHtml(eventName || '')}</strong>.</p>
      <p style="margin:10px 0 0;font-size:14px;color:#0c4a6e;"><strong>When:</strong> ${escapeHtml(eventDateTime || '')}<br /><strong>Where:</strong> ${escapeHtml(venueName || '')}, ${escapeHtml(city || '')}</p>
      <p style="margin:10px 0 0;font-size:14px;color:#0c4a6e;">Please keep your digital ticket ready for check-in.</p>
    </div>
  `;

  return {
    subject: `Event Reminder: ${eventName || 'Upcoming Event'}`,
    text: `Reminder for ${eventName} on ${eventDateTime}.`,
    html: renderBaseTemplate({
      preheader: 'Your event starts soon',
      heading: 'Event Reminder',
      intro: 'Your event is coming up. Here is a quick summary.',
      bodyHtml,
      ctaLabel: 'View My Tickets',
      ctaUrl: myTicketsUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-tickets`,
      supportEmail: process.env.SUPPORT_EMAIL
    })
  };
};

// Update for: feat(controlroom): implement event media upload endpoints under /api/upload
// Update for: feat(controlroom): add payout history and reconciliation services
// Update for: feat(controlroom): optimize Prisma indexes for organizer analytics and dashboard queries
// Update for: feat(controlroom): create staff management UI and assignment screens