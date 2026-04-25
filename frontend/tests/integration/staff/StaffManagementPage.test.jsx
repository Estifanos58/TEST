import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Ensure TextEncoder exists before loading router or other ESM modules
if (typeof global.TextEncoder === 'undefined') {
  // eslint-disable-next-line global-require
  global.TextEncoder = require('util').TextEncoder;
}

const { renderWithRouter, setLocalStorageAuth } = require('../../test-utils');
const { sampleStaff, sampleEvent } = require('../../fixtures/staffFixtures');

jest.mock('../../../src/api/client', () => ({
  eventAPI: { getAll: jest.fn() },
  staffAPI: { getStaffMembers: jest.fn(), createStaff: jest.fn() },
}));

const client = require('../../../src/api/client');
const { StaffManagementPage } = require('../../../src/pages/organizer/StaffManagementPage');

describe('StaffManagementPage integration (basic)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setLocalStorageAuth({ token: 'token', user: { id: 'org-1' } });
    client.eventAPI.getAll.mockResolvedValue({ success: true, events: [sampleEvent] });

    const staffList = [sampleStaff];
    global.fetch = jest.fn((url, opts) => {
      if (url.includes('/staff/members')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, staff: staffList }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: false }) });
    });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('TC-BE-01: navigate to /staff/management → staff list loads', async () => {
    renderWithRouter(<StaffManagementPage />, { route: '/staff/management' });
    expect(await screen.findByText(sampleStaff.full_name)).toBeInTheDocument();
  });

  test('TC-BE-02: click Add Staff → form/modal appears', async () => {
    renderWithRouter(<StaffManagementPage />, { route: '/staff/management' });
    const addButton = await screen.findByRole('button', { name: /add staff/i });
    userEvent.click(addButton);
    // Modal header is a heading element with the same text
    expect(await screen.findByRole('heading', { name: /Add Staff Member/i })).toBeInTheDocument();
  });
});
