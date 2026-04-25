/**
 * Unit tests for sales charts in EventAnalyticsPage.
 */
import React from 'react';
import { screen, render, within } from '@testing-library/react';

// Ensure TextEncoder exists before loading react-router-dom
if (typeof global.TextEncoder === 'undefined') {
  // eslint-disable-next-line global-require
  global.TextEncoder = require('util').TextEncoder;
}
const { MemoryRouter, Routes, Route } = require('react-router-dom');
const { renderWithRouter, setLocalStorageAuth } = require('../../test-utils');
const { sampleEvent, sampleAnalytics } = require('../../fixtures/analytics/eventAnalyticsFixture');

// Mock out recharts to simplify rendering in tests
jest.mock('recharts', () => {
  const React = require('react');
  return {
    ResponsiveContainer: ({ children }) => React.createElement('div', { 'data-testid': 'responsive-container' }, children),
    BarChart: ({ children }) => React.createElement('div', { 'data-testid': 'bar-chart' }, children),
    AreaChart: ({ children }) => React.createElement('div', { 'data-testid': 'area-chart' }, children),
    PieChart: ({ children }) => React.createElement('div', { 'data-testid': 'pie-chart' }, children),
    Bar: () => React.createElement('div', null),
    Area: () => React.createElement('div', null),
    Pie: ({ children }) => React.createElement('div', null, children),
    Cell: () => React.createElement('div', null),
    XAxis: () => React.createElement('div', null),
    YAxis: () => React.createElement('div', null),
    CartesianGrid: () => React.createElement('div', null),
    Tooltip: () => React.createElement('div', null),
  };
});

// Mock Auth context
jest.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { full_name: 'Test Organizer', id: 'user-1' }, logout: jest.fn() }),
}));

import { EventAnalyticsPage } from '../../../src/pages/organizer/EventAnalyticsPage';

describe('SalesChart (EventAnalyticsPage) - Unit', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setLocalStorageAuth({ full_name: 'Test Organizer', id: 'user-1' });
  });

  it('renders chart with valid data', async () => {
    // Mock fetch for event and analytics endpoints
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

    // Wait for header to show the event title
    expect(await screen.findByText('Test Event')).toBeInTheDocument();

    // Chart headings should be present and ticket distribution rendered
    expect(screen.getByText(/Daily Ticket Sales/)).toBeInTheDocument();
    expect(screen.getByText(/Ticket Distribution by Type/)).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getByText('General')).toBeInTheDocument();
  });

  it('does not render blank chart (shows fallback when no data)', async () => {
    // Analytics with empty arrays
    global.fetch = jest.fn((url) => {
      if (String(url).includes('/events/evt-1')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, event: sampleEvent }) });
      }
      if (String(url).includes('/analytics/event/evt-1')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, analytics: { ...sampleAnalytics, daily_sales: [], ticket_distribution: [] } }) });
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
    // Fallback text should be visible for no sales data
    expect(screen.getByText('No sales data yet')).toBeInTheDocument();
    expect(screen.getByText('No ticket sales yet')).toBeInTheDocument();
  });
});
