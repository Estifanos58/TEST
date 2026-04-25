jest.mock('../../../config/database', () => ({
  prisma: {
    ban: { findFirst: jest.fn() },
    eventCategory: { findUnique: jest.fn() },
    $transaction: jest.fn()
  }
}));

const { prisma } = require('../../../config/database');
const { createEvent } = require('../../../controllers/eventController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('eventController (unit)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('banned organizer cannot create event', async () => {
    prisma.ban.findFirst.mockResolvedValue({ id: 'ban1', reason: 'x' });

    const req = { user: { id: 'org1', role_id: 2 }, body: { category_id: 'c1' } };
    const res = mockRes();

    await createEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'ORGANIZER_BANNED' }));
  });

  test('non-banned organizer can create event', async () => {
    prisma.ban.findFirst.mockResolvedValue(null);
    prisma.eventCategory.findUnique.mockResolvedValue({ id: 'c1' });
    prisma.$transaction.mockImplementation(async (fn) => fn({
      event: { create: jest.fn().mockResolvedValue({ id: 'ev1', status: 'published' }) },
      ticketType: { createMany: jest.fn().mockResolvedValue({}) }
    }));

    const req = { user: { id: 'org1', role_id: 2 }, body: { category_id: 'c1', start_datetime: new Date().toISOString(), end_datetime: new Date().toISOString() } };
    const res = mockRes();

    await createEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
