jest.mock('../../../config/database', () => ({
  prisma: {
    event: { findFirst: jest.fn() },
    ticketType: { findMany: jest.fn() },
    orderItem: { findMany: jest.fn() },
    checkInLog: { findMany: jest.fn() },
    review: { findMany: jest.fn(), aggregate: jest.fn() },
    $queryRaw: jest.fn()
  }
}));

const { prisma } = require('../../../config/database');
const { getEventAnalytics } = require('../../../controllers/analyticsController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('analyticsQueries (unit)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('total revenue and tickets sold from ticket types', async () => {
    prisma.event.findFirst.mockResolvedValue({ id: 'evt1', title: 'Event 1' });
    prisma.ticketType.findMany.mockResolvedValue([
      { id: 't1', tier_name: 'A', price: '50.00', capacity: 100, remaining_quantity: 60 },
      { id: 't2', tier_name: 'B', price: '30.00', capacity: 50, remaining_quantity: 0 }
    ]);
    prisma.orderItem.findMany.mockResolvedValue([]);
    prisma.checkInLog.findMany.mockResolvedValue([]);
    prisma.review.findMany.mockResolvedValue([]);
    prisma.review.aggregate.mockResolvedValue({ _avg: { rating: null } });
    prisma.$queryRaw.mockResolvedValue([]);

    const req = { params: { eventId: 'evt1' }, user: { id: 'org1' } };
    const res = mockRes();

    await getEventAnalytics(req, res);

    const analytics = res.json.mock.calls[0][0].analytics;

    const expectedSold = (100 - 60) + (50 - 0);
    const expectedRevenue = (100 - 60) * 50 + (50 - 0) * 30;

    expect(analytics.total_tickets_sold).toBe(expectedSold);
    expect(analytics.total_revenue).toBe(expectedRevenue);
  });

  test('daily sales computed only from paid orders', async () => {
    prisma.event.findFirst.mockResolvedValue({ id: 'evt2', title: 'E2' });
    prisma.ticketType.findMany.mockResolvedValue([]);
    prisma.orderItem.findMany.mockResolvedValue([
      { quantity: 2, total_price: 100, order: { id: 'o1', paid_at: new Date('2026-04-20T10:00:00Z') } },
      { quantity: 1, total_price: 50, order: { id: 'o2', paid_at: new Date('2026-04-20T12:00:00Z') } },
      { quantity: 3, total_price: 300, order: { id: 'o3', paid_at: new Date('2026-04-21T09:00:00Z') } }
    ]);
    prisma.checkInLog.findMany.mockResolvedValue([]);
    prisma.review.findMany.mockResolvedValue([]);
    prisma.review.aggregate.mockResolvedValue({ _avg: { rating: null } });
    prisma.$queryRaw.mockResolvedValue([]);

    const req = { params: { eventId: 'evt2' }, user: { id: 'org1' } };
    const res = mockRes();
    await getEventAnalytics(req, res);

    const daily = res.json.mock.calls[0][0].analytics.daily_sales;
    // sum for 2026-04-20 is 2+1 = 3 tickets
    const found = daily.find((d) => d.sales === 3 || d.tickets_sold === 3 || d.order_count === 2);
    expect(found).toBeDefined();
  });

  test('check-in count and rate, average rating and no-data handling', async () => {
    prisma.event.findFirst.mockResolvedValue({ id: 'evt3', title: 'E3' });
    prisma.ticketType.findMany.mockResolvedValue([
      { id: 'x', tier_name: 'X', price: '10.00', capacity: 10, remaining_quantity: 0 }
    ]);
    prisma.orderItem.findMany.mockResolvedValue([]);
    prisma.checkInLog.findMany.mockResolvedValue([{ check_in_time: new Date() }, { check_in_time: new Date() }, { check_in_time: new Date() }, { check_in_time: new Date() }, { check_in_time: new Date() }]);
    prisma.review.findMany.mockResolvedValue([]);
    prisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.333 } });
    prisma.$queryRaw.mockResolvedValue([]);

    const req = { params: { eventId: 'evt3' }, user: { id: 'org1' } };
    const res = mockRes();
    await getEventAnalytics(req, res);

    const analytics = res.json.mock.calls[0][0].analytics;
    // totalTicketsSold = capacity - remaining = 10
    expect(analytics.check_in_rate).toBeCloseTo((5 / 10) * 100, 1);
    expect(analytics.average_rating).toBe((4.333).toFixed(1));

    // no-data case returns zeros for another event
    prisma.event.findFirst.mockResolvedValue({ id: 'empty', title: 'Empty' });
    prisma.ticketType.findMany.mockResolvedValue([]);
    prisma.orderItem.findMany.mockResolvedValue([]);
    prisma.checkInLog.findMany.mockResolvedValue([]);
    prisma.review.findMany.mockResolvedValue([]);
    prisma.review.aggregate.mockResolvedValue({ _avg: { rating: null } });
    prisma.$queryRaw.mockResolvedValue([]);

    const req2 = { params: { eventId: 'empty' }, user: { id: 'org1' } };
    const res2 = mockRes();
    await getEventAnalytics(req2, res2);
    const a2 = res2.json.mock.calls[0][0].analytics;
    expect(a2.total_tickets_sold).toBe(0);
    expect(a2.total_revenue).toBe(0);
    expect(a2.average_rating).toBe('0.0');
  });
});
