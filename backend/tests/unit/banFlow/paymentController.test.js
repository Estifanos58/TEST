jest.mock('../../../config/database', () => ({
  prisma: {
    ticketType: { findMany: jest.fn() },
    event: { findMany: jest.fn() },
    ban: { findMany: jest.fn() },
    user: { findUnique: jest.fn() },
    $transaction: jest.fn(),
    order: { findUnique: jest.fn() }
  }
}));

jest.mock('../../../services/chapaService', () => ({ initializePayment: jest.fn().mockResolvedValue({ success: true, checkout_url: 'https://c' }), verifyPayment: jest.fn() }));

const { prisma } = require('../../../config/database');
const { initPayment } = require('../../../controllers/paymentController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('paymentController (unit)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('banned user blocked from payment', async () => {
    prisma.ticketType.findMany.mockResolvedValue([{ id: 'tt1', event_id: 'e1', price: 100, remaining_quantity: 10 }]);
    prisma.event.findMany.mockResolvedValue([{ id: 'e1', organizer_id: 'org1', organizer: { full_name: 'Org' } }]);
    prisma.ban.findMany.mockResolvedValue([{ id: 'ban1', organizer_id: 'org1', reason: 'r' }]);
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'u@example.com', full_name: 'U' });

    const req = { user: { id: 'u1' }, body: { order_id: 'o1', total_amount: 110, line_items: [{ event_id: 'e1', ticket_type_id: 'tt1', quantity: 1 }] } };
    const res = mockRes();

    await initPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'BANNED_FROM_ORGANIZER' }));
  });

  test('non-banned user allowed to init payment', async () => {
    prisma.ticketType.findMany.mockResolvedValue([{ id: 'tt1', event_id: 'e1', price: 100, remaining_quantity: 10 }]);
    prisma.event.findMany.mockResolvedValue([{ id: 'e1', organizer_id: 'org1', organizer: { full_name: 'Org' } }]);
    prisma.ban.findMany.mockResolvedValue([]);
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'u@example.com', full_name: 'U' });
    prisma.$transaction.mockImplementation(async (fn) => {
      return await fn({
        order: { upsert: jest.fn().mockResolvedValue({ id: 'ord1' }) },
        orderItem: { deleteMany: jest.fn().mockResolvedValue({}), createMany: jest.fn().mockResolvedValue({}) }
      });
    });

    const req = { user: { id: 'u1' }, body: { order_id: 'o1', total_amount: 110, line_items: [{ event_id: 'e1', ticket_type_id: 'tt1', quantity: 1 }], user_name: 'U' } };
    const res = mockRes();

    await initPayment(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, checkout_url: expect.any(String) }));
  });

  test('inactive ban ignored (treated as non-banned)', async () => {
    prisma.ban.findMany.mockResolvedValue([]);
    prisma.ticketType.findMany.mockResolvedValue([{ id: 'tt1', event_id: 'e1', price: 100, remaining_quantity: 10 }]);
    prisma.event.findMany.mockResolvedValue([{ id: 'e1', organizer_id: 'org1', organizer: { full_name: 'Org' } }]);
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'u@example.com' });
    prisma.$transaction.mockImplementation(async (fn) => {
      return await fn({
        order: { upsert: jest.fn().mockResolvedValue({ id: 'ord1' }) },
        orderItem: { deleteMany: jest.fn().mockResolvedValue({}), createMany: jest.fn().mockResolvedValue({}) }
      });
    });

    const req = { user: { id: 'u1' }, body: { order_id: 'o1', total_amount: 110, line_items: [{ event_id: 'e1', ticket_type_id: 'tt1', quantity: 1 }], user_name: 'U' } };
    const res = mockRes();

    await initPayment(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
