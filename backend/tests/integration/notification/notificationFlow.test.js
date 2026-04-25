const request = require('supertest');
const express = require('express');

jest.mock('../../../services/mailService', () => ({ sendTemplateEmail: jest.fn().mockResolvedValue({ success: true }) }));

// Mock auth middleware to inject admin user
jest.mock('../../../middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'admin1', role_id: 1, email: 'admin@example.com', full_name: 'Admin' };
    next();
  },
  authorize: () => (req, res, next) => next()
}));

const mockPrismaFactory = () => {
  const users = new Map([['u-approve', { id: 'u-approve', role_id: 2, status: 'pending', email: 'approve@example.com', full_name: 'Approve User' }]]);

  return {
    user: {
      updateMany: async ({ where, data }) => {
        const u = users.get(where.id);
        if (!u || where.role_id !== u.role_id) return { count: 0 };
        const updated = { ...u, ...data };
        users.set(where.id, updated);
        return { count: 1 };
      },
      findUnique: async ({ where }) => users.get(where.id) || null
    },
    organizerProfile: {
      upsert: async () => ({})
    }
  };
};

const mockPrisma = mockPrismaFactory();
jest.mock('../../../config/database', () => ({ prisma: mockPrisma }));

const adminRoutes = require('../../../routes/adminRoutes');

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('notification integration (admin approve flow)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('approveOrganizer triggers organizer emails', async () => {
    const res = await request(app)
      .put('/api/admin/approve/u-approve')
      .send();

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('email', 'approve@example.com');

    const { sendTemplateEmail } = require('../../../services/mailService');
    expect(sendTemplateEmail).toHaveBeenCalled();
    // called for organizer approval and account status
    expect(sendTemplateEmail.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
