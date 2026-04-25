import React from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Ensure TextEncoder exists before loading router or other ESM modules
if (typeof global.TextEncoder === 'undefined') {
  // eslint-disable-next-line global-require
  global.TextEncoder = require('util').TextEncoder;
}

const { renderWithRouter, setLocalStorageAuth } = require('../../test-utils');
const { sampleEvent, sampleEvents } = require('../../fixtures/staffFixtures');

jest.mock('../../../src/api/client', () => ({
  eventAPI: { getAll: jest.fn() },
  staffAPI: { getStaffMembers: jest.fn(), createStaff: jest.fn() },
}));

const client = require('../../../src/api/client');
const { eventAPI, staffAPI } = client;

const { StaffManagementPage } = require('../../../src/pages/organizer/StaffManagementPage');

describe('EventStaffSelector (inline in StaffManagementPage)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setLocalStorageAuth({ token: 'test-token', user: { id: 'org-1' } });
  });

  test('renders event dropdown and displays provided events', async () => {
    eventAPI.getAll.mockResolvedValue({ success: true, events: sampleEvents });
    staffAPI.getStaffMembers.mockResolvedValue({ success: true, staff: [] });

    renderWithRouter(<StaffManagementPage />, { route: '/staff/management' });
    const addButton = await screen.findByRole('button', { name: /add staff/i });
    userEvent.click(addButton);

    const eventLabel = await screen.findByText(/assign to event/i);
    const eventSelect = eventLabel.parentElement.querySelector('select');
    expect(eventSelect).toBeInTheDocument();
    expect(within(eventSelect).getByRole('option', { name: /Test Event/i })).toBeInTheDocument();
    expect(within(eventSelect).getByRole('option', { name: /Other Event/i })).toBeInTheDocument();
  });

  test('handles empty event list', async () => {
    eventAPI.getAll.mockResolvedValue({ success: true, events: [] });
    staffAPI.getStaffMembers.mockResolvedValue({ success: true, staff: [] });

    renderWithRouter(<StaffManagementPage />, { route: '/staff/management' });
    const addButton = await screen.findByRole('button', { name: /add staff/i });
    userEvent.click(addButton);

    const eventLabel = await screen.findByText(/assign to event/i);
    const eventSelect = eventLabel.parentElement.querySelector('select');
    expect(eventSelect).toBeInTheDocument();
    // The placeholder option should still be present
    expect(within(eventSelect).getByRole('option', { name: /select an event/i })).toBeInTheDocument();
  });

  test('selects event correctly', async () => {
    eventAPI.getAll.mockResolvedValue({ success: true, events: sampleEvents });
    staffAPI.getStaffMembers.mockResolvedValue({ success: true, staff: [] });

    renderWithRouter(<StaffManagementPage />, { route: '/staff/management' });
    const addButton = await screen.findByRole('button', { name: /add staff/i });
    userEvent.click(addButton);

    const eventLabel = await screen.findByText(/assign to event/i);
    const eventSelect = eventLabel.parentElement.querySelector('select');
    await userEvent.selectOptions(eventSelect, 'evt-1');
    expect(eventSelect.value).toBe('evt-1');
  });
});
