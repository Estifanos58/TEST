jest.mock('../../../config/database', () => ({
  prisma: {
    notification: { create: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() }
  }
}));

jest.mock('../../../services/mailService', () => ({
  sendTemplateEmail: jest.fn()
}));

const { prisma } = require('../../../config/database');
const { sendTemplateEmail } = require('../../../services/mailService');
const {
  sendTicketConfirmation,
  sendEventReminder,
  sendOrganizerApproval,
  getUserNotifications,
  markAsRead
} = require('../../../services/notificationService');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('notificationService (unit)', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    if (console.error && console.error.mockRestore) console.error.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sendTicketConfirmation creates notification and sends email on success', async () => {
    prisma.notification.create.mockResolvedValue({ id: 'n1' });
    sendTemplateEmail.mockResolvedValue({ success: true, messageId: 'm1' });

    const user = { id: 'u1', email: 'u@example.com', full_name: 'U' };
    const order = { order_number: 'ORD123', total_amount: 100 };
    const tickets = [{ id: 't1' }];

    const result = await sendTicketConfirmation(user, order, tickets);

    expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ user_id: user.id, type: 'purchase' })
    }));

    expect(result).toEqual(expect.objectContaining({ success: true }));
  });

  test('sendTicketConfirmation still creates notification when email fails', async () => {
    prisma.notification.create.mockResolvedValue({ id: 'n2' });
    sendTemplateEmail.mockResolvedValue({ success: false, error: 'smtp' });

    const user = { id: 'u2', email: 'u2@example.com', full_name: 'U2' };
    const order = { order_number: 'ORDX', total_amount: 50 };

    const result = await sendTicketConfirmation(user, order, []);

    expect(prisma.notification.create).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ success: false, error: 'smtp' }));
  });

  test('getUserNotifications returns notifications on success', async () => {
    const notifications = [{ id: 'n1', message: 'hi' }];
    prisma.notification.findMany.mockResolvedValue(notifications);

    const req = { user: { id: 'u1' } };
    const res = mockRes();

    await getUserNotifications(req, res);

    expect(prisma.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { user_id: 'u1' } }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, notifications }));
  });

  test('getUserNotifications handles DB errors', async () => {
    prisma.notification.findMany.mockRejectedValue(new Error('db'));

    const req = { user: { id: 'u1' } };
    const res = mockRes();

    await getUserNotifications(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('markAsRead updates notification and returns success', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 1 });

    const req = { params: { id: 'n1' }, user: { id: 'u1' } };
    const res = mockRes();

    await markAsRead(req, res);

    expect(prisma.notification.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'n1', user_id: 'u1' })
    }));

    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
