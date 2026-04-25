import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Ensure TextEncoder exists before loading router or other ESM modules
if (typeof global.TextEncoder === 'undefined') {
  // eslint-disable-next-line global-require
  global.TextEncoder = require('util').TextEncoder;
}

const { renderWithRouter, setLocalStorageAuth } = require('../../test-utils');
const { sampleEvent } = require('../../fixtures/staffFixtures');

jest.mock('../../../src/api/client', () => ({
  eventAPI: { getAll: jest.fn() },
  staffAPI: { getStaffMembers: jest.fn(), createStaff: jest.fn() },
}));

const client = require('../../../src/api/client');
const { eventAPI, staffAPI } = client;

const { StaffManagementPage } = require('../../../src/pages/organizer/StaffManagementPage');

describe('StaffPermissions (inline in StaffManagementPage)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setLocalStorageAuth({ token: 'test-token', user: { id: 'org-1', role: 'organizer' } });
    eventAPI.getAll.mockResolvedValue({ success: true, events: [sampleEvent] });
    staffAPI.getStaffMembers.mockResolvedValue({ success: true, staff: [] });
  });

  test('renders role select and toggles roles', async () => {
    renderWithRouter(<StaffManagementPage />, { route: '/staff/management' });
    const addButton = await screen.findByRole('button', { name: /add staff/i });
    userEvent.click(addButton);

    // label and select are separate elements; find select via the label's parent
    const roleLabel = await screen.findByText(/assigned role/i);
    const roleSelect = roleLabel.parentElement.querySelector('select');
    expect(roleSelect).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Security/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Staff/i })).toBeInTheDocument();

    await userEvent.selectOptions(roleSelect, 'security');
    expect(roleSelect.value).toBe('security');
  });

  test('reflects selected permission (role) in form state', async () => {
    renderWithRouter(<StaffManagementPage />, { route: '/staff/management' });
    const addButton = await screen.findByRole('button', { name: /add staff/i });
    userEvent.click(addButton);
    const roleLabel = await screen.findByText(/assigned role/i);
    const roleSelect = roleLabel.parentElement.querySelector('select');
    await userEvent.selectOptions(roleSelect, 'staff');
    expect(roleSelect.value).toBe('staff');
  });
});
