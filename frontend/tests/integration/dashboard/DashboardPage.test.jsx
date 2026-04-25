/**
 * Integration tests for the Admin Dashboard routes and KPI rendering.
 */
import React from 'react';
import { screen } from '@testing-library/react';

// Ensure TextEncoder exists before loading react-router-dom
if (typeof global.TextEncoder === 'undefined') {
  // eslint-disable-next-line global-require
  global.TextEncoder = require('util').TextEncoder;
}
const { MemoryRouter, Routes, Route } = require('react-router-dom');
const { renderWithRouter, setLocalStorageAuth } = require('../../test-utils');

// Mock Auth context
jest.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { full_name: 'Admin User', email: 'admin@example.com', id: 'admin-1' }, logout: jest.fn() }),
}));

// Mock api client pieces used by AdminDashboard
jest.mock('../../../src/api/client', () => ({
  adminCategoryAPI: { getAll: jest.fn(), create: jest.fn(), delete: jest.fn() },
  moderationAPI: {
    getAdminReports: jest.fn(),
    getAdminAppeals: jest.fn(),
    decideAdminReport: jest.fn(),
    decideAdminAppeal: jest.fn(),
  },
}));

import { AdminDashboard } from '../../../src/pages/admin/AdminDashboard';

describe('Admin Dashboard - Integration', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setLocalStorageAuth({ full_name: 'Admin User', email: 'admin@example.com' });
    // Ensure mocked client APIs return expected shapes used by AdminDashboard
    // Importing the mocked client here to set resolved values
    // eslint-disable-next-line global-require
    const { adminCategoryAPI, moderationAPI } = require('../../../src/api/client');
    adminCategoryAPI.getAll.mockResolvedValue({ categories: [] });
    moderationAPI.getAdminReports.mockResolvedValue({ reports: [] });
    moderationAPI.getAdminAppeals.mockResolvedValue({ appeals: [] });
  });

  it('TC-SH-01/TC-SH-02: login as admin -> /admin/dashboard renders and shows KPI values', async () => {
    // Mock admin stats and pending organizers
    global.fetch = jest.fn((url) => {
      if (String(url).includes('/admin/stats')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, stats: { total_users: 42, total_events: 10, total_tickets_sold: 250, total_revenue: 125000 } }) });
      }
      if (String(url).includes('/admin/pending-organizers')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, pending: [] }) });
      }
      // platform fee endpoints and others fallback
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
    });

    renderWithRouter(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </MemoryRouter>,
    );

    // Wait for header and KPI values
    expect(await screen.findByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Tickets Sold')).toBeInTheDocument();
    expect(screen.getByText('ETB 125,000')).toBeInTheDocument();
  });
});
