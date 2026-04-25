const request = require('supertest');
const express = require('express');

jest.mock('../../../services/mailService', () => ({ sendTemplateEmail: jest.fn().mockResolvedValue({ success: true }) }));

// Mock auth middleware to inject req.user from headers
jest.mock('../../../middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = {
      id: req.headers['x-user-id'] || 'u-guest',
      email: req.headers['x-user-email'] || null,
      full_name: req.headers['x-user-name'] || 'Test User',
      role: req.headers['x-user-role'] || null,
      role_id: req.headers['x-user-role'] === 'organizer' ? 2 : 1
    };
    next();
  },
  authorize: (role) => (req, res, next) => {
    if (role === 'admin' && req.user?.email !== 'nexussphere0974@gmail.com') {
      return res.status(403).json({ success: false, message: 'Only super admin can decide reports' });
    }
    if (role === 'organizer' && req.user?.role !== 'organizer') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    next();
  }
}));

// In-memory mock prisma
const createMockPrisma = () => {
  const reports = new Map();
  const bans = new Map();
  const reviews = new Map([['rev1', { id: 'rev1', user_id: 'subject1', event: { id: 'evt1', title: 'Event 1', organizer_id: 'org1' } }]]);
  const users = new Map([
    ['subject1', { id: 'subject1', full_name: 'Subject', email: 'subject@example.com' }],
    ['org1', { id: 'org1', full_name: 'Org', email: 'org@example.com', organizer_profile: { organization_name: 'Org Inc' } }],
    ['reporter1', { id: 'reporter1', full_name: 'Reporter', email: 'rep@example.com' }],
    ['subjectOrg', { id: 'subjectOrg', full_name: 'Subject Org', email: 'org2@example.com', organizer_profile: { organization_name: 'Subject Org Inc' } }]
  ]);
  const events = new Map([['evt1', { id: 'evt1', title: 'Event 1', organizer_id: 'org1', status: 'published', organizer: users.get('org1') }]]);

  return {
    review: {
      findUnique: async ({ where }) => reviews.get(where.id) || null
    },
    user: {
      findUnique: async ({ where }) => users.get(where.id) || users.get(where.email) || null
    },
    report: {
      findFirst: async ({ where }) => {
        for (const r of reports.values()) {
          if (where && where.scope === r.scope && where.status === r.status && where.reporter_id === r.reporter_id) return r;
        }
        return null;
      },
      create: async ({ data }) => { const id = data.id || `rep-${Date.now()}`; const rec = { ...data, id, status: data.status || 'pending' }; reports.set(id, rec); return rec; },
      findUnique: async ({ where }) => reports.get(where.id) || null,
      update: async ({ where, data }) => { const r = reports.get(where.id); const updated = { ...r, ...data }; reports.set(where.id, updated); return updated; }
    },
    ban: {
      findFirst: async ({ where }) => {
        for (const b of bans.values()) {
          if (b.scope === where.scope && b.status === 'active' && b.subject_user_id === where.subject_user_id && (!where.organizer_id || b.organizer_id === where.organizer_id)) return b;
        }
        return null;
      },
      create: async ({ data }) => { const id = data.id || `ban-${Date.now()}`; const rec = { ...data, id, status: 'active' }; bans.set(id, rec); return rec; },
      findMany: async ({ where }) => {
        return Array.from(bans.values()).filter(b => b.status === where.status && b.scope === where.scope && b.subject_user_id === where.subject_user_id && where.organizer_id && where.organizer_id.in ? where.organizer_id.in.includes(b.organizer_id) : true);
      }
    },
    event: {
      findUnique: async ({ where }) => events.get(where.id) || null,
      findMany: async ({ where }) => Array.from(events.values()).filter(e => where && where.organizer_id && where.organizer_id.in ? where.organizer_id.in.includes(e.organizer_id) : true),
      updateMany: async ({ where, data }) => { for (const [k, ev] of events) { if (ev.organizer_id === where.organizer_id && ev.status === where.status) { ev.status = data.status; events.set(k, ev); } } return { count: 1 }; }
    },
    $transaction: async (fn) => {
      const tx = {
        report: {
          update: async ({ where, data }) => {
            const r = reports.get(where.id);
            const updated = { ...r, ...data };
            reports.set(where.id, updated);
            return updated;
          }
        },
        event: {
          updateMany: async ({ where, data }) => {
            let count = 0;
            for (const [k, ev] of events) {
              if (ev.organizer_id === where.organizer_id && ev.status === where.status) {
                ev.status = data.status;
                events.set(k, ev);
                count += 1;
              }
            }
            return { count };
          }
        }
      };
      return fn(tx);
    },
    notification: {
      create: async ({ data }) => ({ ...data })
    },
    ticketType: { findMany: async () => [{ id: 'tt1', event_id: 'evt1', price: 100, remaining_quantity: 10 }] }
  };
};

const mockPrisma = createMockPrisma();
jest.mock('../../../config/database', () => ({ prisma: mockPrisma }));

const moderationRoutes = require('../../../routes/moderationRoutes');
const eventRoutes = require('../../../routes/eventRoutes');
const paymentRoutes = require('../../../routes/paymentRoutes');

const app = express();
app.use(express.json());
app.use('/api/moderation', moderationRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/payments', paymentRoutes);

describe('ban flows (integration)', () => {
  beforeEach(() => {
    // reset maps
  });

  test('report -> decision -> ban stored', async () => {
    // submit report
    const res1 = await request(app)
      .post('/api/moderation/reports/review-user')
      .set('x-user-id', 'reporter1')
      .send({ review_id: 'rev1', reason: 'abuse' });

    expect(res1.status).toBe(201);
    const reportId = res1.body.report_id;

    // organizer decides -> ban
    const res2 = await request(app)
      .post(`/api/moderation/organizer/reports/${reportId}/decision`)
      .set('x-user-id', 'org1')
      .set('x-user-role', 'organizer')
      .send({ action: 'ban' });

    expect(res2.status).toBe(200);
    expect(res2.body.decision).toBe('ban');
  });

  test('organizer ban blocks checkout', async () => {
    // assume ban exists for subject1 against org1
    // try to init payment as subject1
    const res = await request(app)
      .post('/api/payments/init')
      .set('x-user-id', 'subject1')
      .send({ order_id: 'o1', total_amount: 100, line_items: [{ event_id: 'evt1', ticket_type_id: 'tt1', quantity: 1 }] });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('BANNED_FROM_ORGANIZER');
  });

  test('admin ban cancels events and blocks creation', async () => {
    // submit event report
    mockPrisma.event.findUnique = async ({ where }) => ({ id: 'evt2', title: 'E2', organizer_id: 'subjectOrg' });

    const rep = await request(app)
      .post('/api/moderation/reports/event')
      .set('x-user-id', 'reporter1')
      .send({ event_id: 'evt2', reason: 'violation' });

    expect(rep.status).toBe(201);
    const rid = rep.body.report_id;

    const decide = await request(app)
      .post(`/api/moderation/admin/reports/${rid}/decision`)
      .set('x-user-email', 'nexussphere0974@gmail.com')
      .set('x-user-role', 'admin')
      .send({ action: 'ban' });

    expect(decide.status).toBe(200);
    expect(decide.body.decision).toBe('ban');

    // creation blocked for banned organizer
    const create = await request(app)
      .post('/api/events')
      .set('x-user-id', 'subjectOrg')
      .set('x-user-role', 'organizer')
      .send({ category_id: 'c1', start_datetime: new Date().toISOString(), end_datetime: new Date().toISOString() });

    expect(create.status).toBe(403);
    expect(create.body.code).toBe('ORGANIZER_BANNED');
  });

  test('edge cases: invalid report, duplicate decision, permission failure', async () => {
    // invalid report id
    const bad = await request(app)
      .post('/api/moderation/organizer/reports/does-not-exist/decision')
      .set('x-user-id', 'org1')
      .set('x-user-role', 'organizer')
      .send({ action: 'ban' });
    expect(bad.status).toBe(404);

    // duplicate decision: create report then resolve then resolve again
    const r = await request(app).post('/api/moderation/reports/review-user').set('x-user-id','reporter1').send({ review_id: 'rev1', reason: 'x' });
    const id = r.body.report_id;
    await request(app).post(`/api/moderation/organizer/reports/${id}/decision`).set('x-user-id','org1').set('x-user-role','organizer').send({ action: 'ban' });
    const dup = await request(app).post(`/api/moderation/organizer/reports/${id}/decision`).set('x-user-id','org1').set('x-user-role','organizer').send({ action: 'ban' });
    expect(dup.status).toBe(400);

    // permission failure: admin decision by non-super-admin
    const r2 = await request(app).post('/api/moderation/reports/event').set('x-user-id','reporter1').send({ event_id: 'evt1', reason: 'x' });
    const rid = r2.body.report_id;
    const perm = await request(app).post(`/api/moderation/admin/reports/${rid}/decision`).set('x-user-email','notadmin@example.com').set('x-user-role','admin').send({ action: 'ban' });
    expect(perm.status).toBe(403);
  });
});
