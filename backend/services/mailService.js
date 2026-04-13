const transporter = require('../config/email');
const templates = require('../mail_templates');

const sendTemplateEmail = async ({ to, template, payload = {} }) => {
  if (!to) {
    return { success: false, error: 'Recipient email is required' };
  }

  const templateBuilder = templates[template];
  if (!templateBuilder) {
    return { success: false, error: `Unknown mail template: ${template}` };
  }

  const { subject, html, text } = templateBuilder(payload);

  try {
    const info = await transporter.sendMail({
      from: `\"${process.env.EMAIL_FROM_NAME || 'DEMS Team'}\" <${process.env.EMAIL_FROM || 'noreply@dems.com'}>`,
      to,
      subject,
      html,
      text
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendTemplateEmail
};
