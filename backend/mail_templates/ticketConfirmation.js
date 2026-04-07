const { renderBaseTemplate, escapeHtml } = require('./baseTemplate');

module.exports = ({ fullName, orderNumber, totalAmount, tickets = [], myTicketsUrl }) => {
  const rows = tickets
    .map((ticket) => `<tr>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;font-size:13px;">${escapeHtml(ticket.event_title || '')}</td>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;font-size:13px;">${escapeHtml(ticket.ticket_type || ticket.tier_name || '')}</td>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;font-size:13px;">${escapeHtml(ticket.quantity || 1)}</td>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;font-size:13px;">ETB ${escapeHtml(ticket.price || '')}</td>
    </tr>`)
    .join('');

  const bodyHtml = `
    <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#334155;">Thank you ${escapeHtml(fullName || '')}. Your order <strong>#${escapeHtml(orderNumber || '')}</strong> has been confirmed.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:10px;text-align:left;font-size:12px;color:#334155;">Event</th>
          <th style="padding:10px;text-align:left;font-size:12px;color:#334155;">Ticket Type</th>
          <th style="padding:10px;text-align:left;font-size:12px;color:#334155;">Qty</th>
          <th style="padding:10px;text-align:left;font-size:12px;color:#334155;">Price</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin:14px 0 0;font-size:14px;color:#0f172a;"><strong>Total Paid:</strong> ETB ${escapeHtml(totalAmount || 0)}</p>
  `;

  return {
    subject: `Ticket Confirmation: Order #${orderNumber || ''}`,
    text: `Your ticket purchase has been confirmed. Order #${orderNumber}. Total ETB ${totalAmount}.`,
    html: renderBaseTemplate({
      preheader: 'Your DEMS tickets are confirmed',
      heading: 'Ticket Purchase Confirmed',
      intro: 'Your digital tickets are available in your account.',
      bodyHtml,
      ctaLabel: 'Open My Tickets',
      ctaUrl: myTicketsUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-tickets`,
      supportEmail: process.env.SUPPORT_EMAIL
    })
  };
};

// Update for: feat(controlroom): implement event media upload endpoints under /api/upload