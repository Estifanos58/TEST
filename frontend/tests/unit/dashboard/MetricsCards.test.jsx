/**
 * Unit tests for KPI cards rendered on the Organizer Dashboard.
 */
import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithRouter, setLocalStorageAuth, flushPromises } from '../../test-utils';
import { sampleEvent } from '../../fixtures/analytics/eventAnalyticsFixture';

// Mock the Auth context used by the page
jest.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { full_name: 'Test Organizer', id: 'user-1' }, logout: jest.fn() }),
}));

// Mock client moderation API used by the dashboard
jest.mock('../../../src/api/client', () => ({
  moderationAPI: {
    getOrganizerReports: jest.fn(),
    getOrganizerAppeals: jest.fn(),
    decideOrganizerReport: jest.fn(),
    decideOrganizerAppeal: jest.fn(),
  },
}));

import { moderationAPI } from '../../../src/api/client';
import { OrganizerDashboard } from '../../../src/pages/organizer/OrganizerDashboard';

describe('MetricsCards (Organizer Dashboard) - Unit', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setLocalStorageAuth({ full_name: 'Test Organizer', id: 'user-1' });

    // Default fetch: return one event for my-events
    global.fetch = jest.fn((url) => {
      if (String(url).includes('/events/organizer/my-events')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, events: [sampleEvent] }) });
      }

      // Fallback analytics endpoints
      return Promise.resolve({ ok: true, json: async () => ({ success: true, stats: { total_tickets_sold: 3, total_revenue: 300, average_tickets_per_event: 3 } }) });
    });

    moderationAPI.getOrganizerReports.mockResolvedValue({ reports: [] });
    moderationAPI.getOrganizerAppeals.mockResolvedValue({ appeals: [] });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders all KPI values (events, tickets, revenue, average)', async () => {
    renderWithRouter(<OrganizerDashboard />, { route: '/organizer/dashboard' });

    // Loading state should show immediately
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();

    // Wait for dashboard to render
    await screen.findByText('Organizer Dashboard');

    // KPIs: total events, tickets sold and revenue should be visible
    expect(screen.getByText('Total Events')).toBeInTheDocument();
    expect(await screen.findByText('ETB 300')).toBeInTheDocument();
    expect(screen.getByText(/Avg 3 per event/)).toBeInTheDocument();
  });

  it('handles loading state (shows skeleton/loading message)', () => {
    // Simulate a pending fetch by returning a never-resolving promise
    global.fetch = jest.fn(() => new Promise(() => {}));
    renderWithRouter(<OrganizerDashboard />, { route: '/organizer/dashboard' });
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('handles empty data (no events)', async () => {
    global.fetch = jest.fn((url) => {
      if (String(url).includes('/events/organizer/my-events')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, events: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true, stats: {} }) });
    });

    renderWithRouter(<OrganizerDashboard />, { route: '/organizer/dashboard' });

    await screen.findByText('My Events');
    expect(screen.getByText('No events created yet')).toBeInTheDocument();
  });
});
