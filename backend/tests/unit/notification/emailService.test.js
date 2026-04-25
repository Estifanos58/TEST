jest.mock('../../../services/mailService', () => ({
  sendTemplateEmail: jest.fn()
}));

const { sendTemplateEmail } = require('../../../services/mailService');
const {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrganizerApplicationReceivedEmail,
  sendAccountStatusEmail
} = require('../../../services/emailService');

describe('emailService (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sendWelcomeEmail calls mailService with correct template and payload', async () => {
    sendTemplateEmail.mockResolvedValue({ success: true, messageId: 'm1' });

    const user = { id: 'u1', email: 'user@example.com', full_name: 'Test User' };

    const res = await sendWelcomeEmail(user);

    expect(sendTemplateEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: user.email,
      template: 'userRegistration',
      payload: expect.objectContaining({ fullName: user.full_name, discoverUrl: expect.any(String) })
    }));

    expect(res).toEqual(expect.objectContaining({ success: true, messageId: 'm1' }));
  });

  test('sendWelcomeEmail throws when mailService returns failure', async () => {
    sendTemplateEmail.mockResolvedValue({ success: false, error: 'SMTP down' });

    const user = { id: 'u2', email: 'nope@example.com', full_name: 'Nope' };

    await expect(sendWelcomeEmail(user)).rejects.toThrow('SMTP down');
  });

  test('sendPasswordResetEmail includes token in reset URL', async () => {
    sendTemplateEmail.mockResolvedValue({ success: true });

    const user = { email: 'pw@example.com', full_name: 'PW' };
    const token = 'tok123';

    await sendPasswordResetEmail(user, token);

    expect(sendTemplateEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: user.email,
      template: 'passwordReset',
      payload: expect.objectContaining({ resetUrl: expect.stringContaining(token) })
    }));
  });

  test('sendAccountStatusEmail sends correct status and reason', async () => {
    sendTemplateEmail.mockResolvedValue({ success: true });

    const user = { email: 'acct@example.com', full_name: 'Acct' };

    await sendAccountStatusEmail(user, 'suspended', 'policy violation');

    expect(sendTemplateEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: user.email,
      template: 'accountStatus',
      payload: expect.objectContaining({ status: 'suspended', reason: 'policy violation' })
    }));
  });
});
