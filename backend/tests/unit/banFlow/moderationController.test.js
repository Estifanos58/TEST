const path = require('path');

jest.mock('../../../config/database', () => ({
  prisma: {
    report: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), findFirst: jest.fn() },
    ban: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    notification: { create: jest.fn() },
    user: { findUnique: jest.fn() }
  }
}));

jest.mock('../../../services/mailService', () => ({ sendTemplateEmail: jest.fn().mockResolvedValue({ success: true }) }));

const { prisma } = require('../../../config/database');
const { decideOrganizerReport, decideAdminReport } = require('../../../controllers/moderationController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('moderationController (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('organizer bans user (success)', async () => {
    prisma.report.findUnique.mockResolvedValue({
      id: 'r1', scope: 'organizer_user', status: 'pending', organizer_id: 'org1', subject_user_id: 'u1', reporter_id: 'rep1', event: { id: 'e1', title: 'E' }
    });
    prisma.ban.findFirst.mockResolvedValue(null);
    prisma.ban.create.mockResolvedValue({ id: 'ban1', reason: 'r' });
    prisma.report.update.mockResolvedValue({ id: 'r1', status: 'resolved_ban' });

    const req = { params: { id: 'r1' }, body: { action: 'ban' }, user: { id: 'org1', full_name: 'Org' } };
    const res = mockRes();

    await decideOrganizerReport(req, res);

    expect(prisma.ban.create).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, decision: 'ban' }));
  });

  test('invalid action returns 400', async () => {
    const req = { params: { id: 'r1' }, body: { action: 'suspend' }, user: { id: 'org1' } };
    const res = mockRes();

    await decideOrganizerReport(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('already resolved report returns 400', async () => {
    prisma.report.findUnique.mockResolvedValue({ id: 'r2', status: 'resolved_ban', scope: 'organizer_user', organizer_id: 'org1' });
    const req = { params: { id: 'r2' }, body: { action: 'ban' }, user: { id: 'org1' } };
    const res = mockRes();
    await decideOrganizerReport(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('unauthorized admin role denied', async () => {
    const req = { params: { id: 'x' }, body: { action: 'ban' }, user: { email: 'notadmin@example.com' } };
    const res = mockRes();
    await decideAdminReport(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
