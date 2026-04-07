const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderBaseTemplate = ({
  preheader,
  heading,
  intro,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  supportEmail
}) => {
  const safePreheader = escapeHtml(preheader);
  const safeHeading = escapeHtml(heading);
  const safeIntro = escapeHtml(intro);
  const safeSupport = escapeHtml(supportEmail || 'support@dems.com');

  return `
    <html>
      <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#1f2937;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safePreheader}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fb;padding:24px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
                <tr>
                  <td style="background:linear-gradient(135deg,#0f766e,#134e4a);padding:24px 28px;">
                    <h1 style="margin:0;font-size:24px;line-height:1.2;color:#ffffff;">DEMS</h1>
                    <p style="margin:8px 0 0;font-size:13px;color:#ccfbf1;">Dinkenesh Event Management System</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <h2 style="margin:0 0 12px;font-size:22px;color:#0f172a;">${safeHeading}</h2>
                    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#334155;">${safeIntro}</p>
                    ${bodyHtml || ''}
                    ${
                      ctaLabel && ctaUrl
                        ? `<p style="margin:24px 0 0;"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">${escapeHtml(ctaLabel)}</a></p>`
                        : ''
                    }
                    <hr style="margin:28px 0;border:none;border-top:1px solid #e5e7eb;" />
                    <p style="margin:0;font-size:12px;line-height:1.7;color:#64748b;">
                      Need help? Contact <a href="mailto:${safeSupport}" style="color:#0f766e;text-decoration:none;">${safeSupport}</a>.<br />
                      DEMS Platform, Addis Ababa, Ethiopia.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

module.exports = {
  renderBaseTemplate,
  escapeHtml
};

// Update for: feat(controlroom): create staff management UI and assignment screens
// Update for: feat(controlroom): connect staff dashboard actions to scan and attendance workflows
// Update for: feat(controlroom): implement financial core logic and platform fee calculation
// Update for: feat(controlroom): optimize Prisma indexes for organizer analytics and dashboard queries
// Update for: feat(controlroom): add dashboard navigation and layout coherence
// Update for: feat(controlroom): add delivery retry and error handling for notifications