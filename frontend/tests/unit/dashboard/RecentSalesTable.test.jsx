/**
 * Unit tests for recent sales / ticket type table in EventAnalyticsPage.
 */
import React from 'react';
import { screen, render, within } from '@testing-library/react';

// Ensure TextEncoder exists before loading react-router-dom
if (typeof global.TextEncoder === 'undefined') {
  // eslint-disable-next-line global-require
  global.TextEncoder = require('util').TextEncoder;
}
const { MemoryRouter, Routes, Route } = require('react-router-dom');
const { setLocalStorageAuth } = require('../../test-utils');
const { sampleEvent, sampleAnalytics } = require('../../fixtures/analytics/eventAnalyticsFixture');

// Mock Auth context
jest.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { full_name: 'Test Organizer', id: 'user-1' }, logout: jest.fn() }),
}));

import { EventAnalyticsPage } from '../../../src/pages/organizer/EventAnalyticsPage';

describe('RecentSalesTable (EventAnalyticsPage) - Unit', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setLocalStorageAuth({ full_name: 'Test Organizer', id: 'user-1' });
  });

  it('displays transaction rows correctly and formats values', async () => {
    global.fetch = jest.fn((url) => {
      if (String(url).includes('/events/evt-1')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, event: sampleEvent }) });
      }
      if (String(url).includes('/analytics/event/evt-1')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, analytics: sampleAnalytics }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
    });

    render(
      <MemoryRouter initialEntries={["/organizer/analytics/evt-1"]}>
        <Routes>
          <Route path="/organizer/analytics/:eventId" element={<EventAnalyticsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Wait for event title
    expect(await screen.findByText('Test Event')).toBeInTheDocument();

    // Table headers should be present
    expect(screen.getByText('Ticket Type')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();

    // Row values rendered from fixture (scope to table to avoid matching legends)
    const table = screen.getByRole('table');
    expect(within(table).getByText('General')).toBeInTheDocument();
    expect(within(table).getByText('ETB 100')).toBeInTheDocument();
    expect(within(table).getByText('3')).toBeInTheDocument();
    expect(within(table).getByText('ETB 300')).toBeInTheDocument();
    expect(within(table).getByText('7')).toBeInTheDocument();
  });

  it('handles empty state (no ticket types)', async () => {
    global.fetch = jest.fn((url) => {
      if (String(url).includes('/events/evt-1')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, event: sampleEvent }) });
      }
      if (String(url).includes('/analytics/event/evt-1')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, analytics: { ...sampleAnalytics, ticket_distribution: [] } }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
    });

    render(
      <MemoryRouter initialEntries={["/organizer/analytics/evt-1"]}>
        <Routes>
          <Route path="/organizer/analytics/:eventId" element={<EventAnalyticsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Test Event')).toBeInTheDocument();
    // Chart fallback should be shown when no ticket distribution
    expect(screen.getByText('No ticket sales yet')).toBeInTheDocument();
  });
});
