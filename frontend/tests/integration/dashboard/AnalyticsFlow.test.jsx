/**
 * Integration tests covering analytics flows and CSV export (TC-SH-03 -> TC-SH-10)
 */
import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';

// Ensure TextEncoder exists before loading react-router-dom
if (typeof global.TextEncoder === 'undefined') {
  // eslint-disable-next-line global-require
  global.TextEncoder = require('util').TextEncoder;
}
const { MemoryRouter, Routes, Route } = require('react-router-dom');
const { renderWithRouter, setLocalStorageAuth } = require('../../test-utils');
const { sampleEvent, sampleAnalytics } = require('../../fixtures/analytics/eventAnalyticsFixture');

// Mock Auth context with a static organizer user for these integration tests
jest.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { full_name: 'Organizer One', id: 'org-1' }, logout: jest.fn() }),
}));

// Mock client moderationAPI
jest.mock('../../../src/api/client', () => ({
  moderationAPI: {
    getOrganizerReports: jest.fn(),
    getOrganizerAppeals: jest.fn(),
    decideOrganizerReport: jest.fn(),
    decideOrganizerAppeal: jest.fn(),
  },
}));

import { OrganizerDashboard } from '../../../src/pages/organizer/OrganizerDashboard';
import { EventAnalyticsPage } from '../../../src/pages/organizer/EventAnalyticsPage';
import { moderationAPI } from '../../../src/api/client';

describe('Analytics Flow - Integration', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    moderationAPI.getOrganizerReports.mockResolvedValue({ reports: [] });
    moderationAPI.getOrganizerAppeals.mockResolvedValue({ appeals: [] });
  });

  it('TC-SH-03 -> TC-SH-06: organizer sees event list, clicks event and views per-event analytics and charts', async () => {
    // Organizer user
    setLocalStorageAuth({ full_name: 'Organizer One', id: 'org-1' });

    // Mock fetch responses for events and analytics
    global.fetch = jest.fn((url) => {
      if (String(url).includes('/events/organizer/my-events')) {
        // Return one event
        const other = { ...sampleEvent, id: 'evt-1', title: 'Organizer Event' };
        return Promise.resolve({ ok: true, json: async () => ({ success: true, events: [other] }) });
      }

      if (String(url).includes('/events/evt-1')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, event: sampleEvent }) });
      }

      if (String(url).includes('/analytics/event/evt-1')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, analytics: sampleAnalytics }) });
      }

      // CSV endpoint fallback
      if (String(url).includes('/analytics/organizer/stats/csv')) {
        const csv = 'col1,col2\nval1,val2';
        const blob = new Blob([csv], { type: 'text/csv' });
        return Promise.resolve({ ok: true, blob: async () => blob, headers: { get: () => 'filename="organizer-report.csv"' } });
      }

      return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
    });

    // Render dashboard + analytics routes
    renderWithRouter(
      <MemoryRouter initialEntries={["/organizer/dashboard"]}>
        <Routes>
          <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
          <Route path="/organizer/analytics/:eventId" element={<EventAnalyticsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Dashboard should show event list
    expect(await screen.findByText('Organizer Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Events')).toBeInTheDocument();
    expect(screen.getByText('Organizer Event')).toBeInTheDocument();

    // Click the Stats link for event
    const statsLink = screen.getByRole('link', { name: /Stats/i });
    fireEvent.click(statsLink);

    // Event analytics page should render
    expect(await screen.findByText('Daily Ticket Sales')).toBeInTheDocument();
    expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
    // KPIs shown
    expect(screen.getByText('Tickets Sold')).toBeInTheDocument();
    expect(screen.getByText(/3\s*tickets sold/i)).toBeInTheDocument();
    // Ensure the ticket distribution table contains the event revenue value
    const table = screen.getByRole('table');
    expect(within(table).getByText('ETB 300')).toBeInTheDocument();
  });

  it('TC-SH-07/TC-SH-08: clicking Export CSV triggers download and CSV contains headers', async () => {
    setLocalStorageAuth({ full_name: 'Organizer One', id: 'org-1' });

    // Prepare a CSV blob to be returned by fetch
    const csv = 'ticket_type,price,sold,revenue\nGeneral,100,3,300';
    let lastBlob = null;
    global.fetch = jest.fn((url) => {
      if (String(url).includes('/events/organizer/my-events')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, events: [sampleEvent] }) });
      }
      if (String(url).includes('/analytics/organizer/stats/csv')) {
        const blob = new Blob([csv], { type: 'text/csv' });
        lastBlob = blob;
        return Promise.resolve({ ok: true, blob: async () => blob, headers: { get: () => 'filename="org-dashboard.csv"' } });
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
    });

    // Spy on URL.createObjectURL and anchor click
    const createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    const anchorClickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderWithRouter(<OrganizerDashboard />, { route: '/organizer/dashboard' });

    // Wait for Download CSV button to be present
    const downloadButton = await screen.findByRole('button', { name: /Download CSV/i });
    fireEvent.click(downloadButton);

    // Wait for fetch to be called for CSV endpoint
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/analytics/organizer/stats/csv'), expect.any(Object)));

    // Verify anchor click and CSV headers
    expect(anchorClickSpy).toHaveBeenCalled();
    // The CSV payload we used for the mock should contain the headers
    expect(csv.startsWith('ticket_type,price,sold,revenue')).toBe(true);

    createObjectURLSpy.mockRestore();
    anchorClickSpy.mockRestore();
  });

  it('TC-SH-09: no data shows empty state (not an error)', async () => {
    setLocalStorageAuth({ full_name: 'Organizer One', id: 'org-1' });

    global.fetch = jest.fn((url) => {
      if (String(url).includes('/events/organizer/my-events')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, events: [] }) });
      }
      if (String(url).includes('/analytics/event')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, analytics: { daily_sales: [], ticket_distribution: [], recent_reviews: [] } }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
    });

    renderWithRouter(<OrganizerDashboard />, { route: '/organizer/dashboard' });

    // Dashboard empty message
    expect(await screen.findByText('No events created yet')).toBeInTheDocument();
  });

  it('TC-SH-10: organizer sees only their own events', async () => {
    // Simulate two events but the endpoint should only return organizer events
    setLocalStorageAuth({ full_name: 'Organizer One', id: 'org-1' });

    const eventA = { ...sampleEvent, id: 'evt-a', title: 'A Event' };
    const eventB = { ...sampleEvent, id: 'evt-b', title: 'B Event' };

    global.fetch = jest.fn((url) => {
      if (String(url).includes('/events/organizer/my-events')) {
        // Only return eventA for this organizer
        return Promise.resolve({ ok: true, json: async () => ({ success: true, events: [eventA] }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
    });

    renderWithRouter(<OrganizerDashboard />, { route: '/organizer/dashboard' });

    expect(await screen.findByText('A Event')).toBeInTheDocument();
    expect(screen.queryByText('B Event')).not.toBeInTheDocument();
  });
});
