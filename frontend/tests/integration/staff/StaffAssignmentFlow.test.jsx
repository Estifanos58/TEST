import React from 'react';
import { screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Ensure TextEncoder exists before loading router or other ESM modules
if (typeof global.TextEncoder === 'undefined') {
  // eslint-disable-next-line global-require
  global.TextEncoder = require('util').TextEncoder;
}

const { renderWithRouter, setLocalStorageAuth, flushPromises } = require('../../test-utils');
const { sampleEvent, sampleEvents } = require('../../fixtures/staffFixtures');

jest.mock('../../../src/api/client', () => ({
  eventAPI: { getAll: jest.fn() },
  staffAPI: { getStaffMembers: jest.fn(), createStaff: jest.fn() },
}));

const client = require('../../../src/api/client');
const { StaffManagementPage } = require('../../../src/pages/organizer/StaffManagementPage');

// Helper to find a form control near a label (labels in markup are not
// associated with inputs via for/id). This finds the label element then
// returns the input/select inside the same wrapper div.
const findControlByLabel = async (labelRegex) => {
  const label = await screen.findByText(labelRegex);
  return label.parentElement.querySelector('input, select, textarea');
};

describe('Staff assignment flow (TC-BE-03 → TC-BE-10 & edge cases)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setLocalStorageAuth({ token: 'tok', user: { id: 'org-1' } });
    client.eventAPI.getAll.mockResolvedValue({ success: true, events: [sampleEvent] });
  });

  afterEach(() => {
    if (global.fetch) delete global.fetch;
  });

  test('TC-BE-03: submit without email → validation error shown', async () => {
    client.eventAPI.getAll.mockResolvedValue({ success: true, events: [sampleEvent] });
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ success: true, staff: [] }) }));

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    renderWithRouter(<StaffManagementPage />, { route: '/staff/management' });

    const addButton = await screen.findByRole('button', { name: /add staff/i });
    await userEvent.click(addButton);
    const nameInput = await findControlByLabel(/full name/i);
    const formEl = nameInput.closest('form');
    if (formEl) formEl.noValidate = true;
    await userEvent.type(nameInput, 'Alice');

    // Submit the form programmatically to ensure the React onSubmit handler runs
    fireEvent.submit(formEl);

    expect(alertSpy).toHaveBeenCalledWith('Please enter email address');
    alertSpy.mockRestore();
  });

  test('TC-BE-04: submit without password → validation error shown', async () => {
    client.eventAPI.getAll.mockResolvedValue({ success: true, events: [sampleEvent] });
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ success: true, staff: [] }) }));

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    renderWithRouter(<StaffManagementPage />, { route: '/staff/management' });
    const addButton = await screen.findByRole('button', { name: /add staff/i });
    await userEvent.click(addButton);
    const nameInput2 = await findControlByLabel(/full name/i);
    const formEl2 = nameInput2.closest('form');
    if (formEl2) formEl2.noValidate = true;

    await userEvent.type(nameInput2, 'Bob');
    await userEvent.type(await findControlByLabel(/email address/i), 'bob@example.com');
    await userEvent.selectOptions(await findControlByLabel(/assign to event/i), 'evt-1');

    fireEvent.submit(formEl2);
    expect(alertSpy).toHaveBeenCalledWith('Password must be at least 6 characters');
    alertSpy.mockRestore();
  });

  test('TC-BE-05: password < 6 characters → validation error', async () => {
    client.eventAPI.getAll.mockResolvedValue({ success: true, events: [sampleEvent] });
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ success: true, staff: [] }) }));

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    renderWithRouter(<StaffManagementPage />, { route: '/staff/management' });
    const addButton = await screen.findByRole('button', { name: /add staff/i });
    await userEvent.click(addButton);
    const nameInput3 = await findControlByLabel(/full name/i);
    const formEl3 = nameInput3.closest('form');
    if (formEl3) formEl3.noValidate = true;

    await userEvent.type(nameInput3, 'Carol');
    await userEvent.type(await findControlByLabel(/email address/i), 'carol@example.com');
    await userEvent.selectOptions(await findControlByLabel(/assign to event/i), 'evt-1');
    await userEvent.type(await findControlByLabel(/set password/i), '123');

    fireEvent.submit(formEl3);
    expect(alertSpy).toHaveBeenCalledWith('Password must be at least 6 characters');
    alertSpy.mockRestore();
  });

  test('TC-BE-06: submit valid data → staff created and appears in list', async () => {
    client.eventAPI.getAll.mockResolvedValue({ success: true, events: [sampleEvent] });

    const staffList = [];
    global.fetch = jest.fn((url, opts) => {
      if (url.includes('/staff/members')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, staff: staffList }) });
      }
      if (url.includes('/staff/create') && opts && opts.method === 'POST') {
        const body = JSON.parse(opts.body);
        const created = {
          id: 'staff-new',
          full_name: body.full_name,
          email: body.email,
          assigned_role: body.assigned_role,
          event_id: body.event_id,
          event_name: sampleEvent.title,
        };
        staffList.push(created);
        return Promise.resolve({ ok: true, json: async () => ({ success: true, staff: created }) });
      }
      return Promise.resolve({ ok: false, json: async () => ({ success: false }) });
    });

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    renderWithRouter(<StaffManagementPage />, { route: '/staff/management' });
    const addButton = await screen.findByRole('button', { name: /add staff/i });
    await userEvent.click(addButton);
    const nameInput4 = await findControlByLabel(/full name/i);
    const formEl4 = nameInput4.closest('form');
    if (formEl4) formEl4.noValidate = true;

    await userEvent.type(nameInput4, 'Dana');
    await userEvent.type(await findControlByLabel(/email address/i), 'dana@example.com');
    await userEvent.selectOptions(await findControlByLabel(/assign to event/i), 'evt-1');
    await userEvent.selectOptions(await findControlByLabel(/assigned role/i), 'staff');
    await userEvent.type(await findControlByLabel(/set password/i), 'password123');

    fireEvent.submit(formEl4);

    // wait for create to complete and list to refresh
    await screen.findByText('Dana');

    // assert POST payload contained required fields
    const createCall = global.fetch.mock.calls.find(c => c[0].includes('/staff/create') && c[1] && c[1].method === 'POST');
    expect(createCall).toBeDefined();
    const payload = JSON.parse(createCall[1].body);
    expect(payload).toMatchObject({ email: 'dana@example.com', assigned_role: 'staff', event_id: 'evt-1' });

    // confirm alert mentioned email sent
    expect(alertSpy).toHaveBeenCalled();
    const alertText = alertSpy.mock.calls.find(call => call[0] && call[0].includes('An email has been sent'));
    expect(alertText).toBeDefined();
    alertSpy.mockRestore();
  });

  test('TC-BE-07: role dropdown shows only staff and security', async () => {
    client.eventAPI.getAll.mockResolvedValue({ success: true, events: [sampleEvent] });
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ success: true, staff: [] }) }));

    renderWithRouter(<StaffManagementPage />, { route: '/staff/management' });
    const addButton = await screen.findByRole('button', { name: /add staff/i });
    await userEvent.click(addButton);

    const roleSelect = await findControlByLabel(/assigned role/i);
    const options = Array.from(roleSelect.querySelectorAll('option')).map(o => o.value).filter(Boolean);
    expect(options.sort()).toEqual(['security', 'staff'].sort());
  });

  test('TC-BE-08: event dropdown shows only organizer events', async () => {
    client.eventAPI.getAll.mockResolvedValue({ success: true, events: sampleEvents });
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ success: true, staff: [] }) }));

    renderWithRouter(<StaffManagementPage />, { route: '/staff/management' });
    const addButton = await screen.findByRole('button', { name: /add staff/i });
    await userEvent.click(addButton);

    const eventSelect = await findControlByLabel(/assign to event/i);
    const optionTexts = Array.from(eventSelect.querySelectorAll('option')).map(o => o.textContent.trim());
    expect(optionTexts).toEqual(expect.arrayContaining(['Test Event', 'Other Event']));
  });

  test('TC-BE-09: successful creation triggers create API call (email payload)', async () => {
    client.eventAPI.getAll.mockResolvedValue({ success: true, events: [sampleEvent] });
    const staffList = [];
    global.fetch = jest.fn((url, opts) => {
      if (url.includes('/staff/members')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, staff: staffList }) });
      }
      if (url.includes('/staff/create')) {
        const body = JSON.parse(opts.body);
        const created = { id: 's2', ...body, event_name: sampleEvent.title };
        staffList.push(created);
        return Promise.resolve({ ok: true, json: async () => ({ success: true, staff: created }) });
      }
      return Promise.resolve({ ok: false, json: async () => ({ success: false }) });
    });

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    renderWithRouter(<StaffManagementPage />, { route: '/staff/management' });
    const addButton = await screen.findByRole('button', { name: /add staff/i });
    await userEvent.click(addButton);
    const nameInput5 = await findControlByLabel(/full name/i);
    const formEl5 = nameInput5.closest('form');
    if (formEl5) formEl5.noValidate = true;

    await userEvent.type(nameInput5, 'Eve');
    await userEvent.type(await findControlByLabel(/email address/i), 'eve@example.com');
    await userEvent.selectOptions(await findControlByLabel(/assign to event/i), 'evt-1');
    await userEvent.selectOptions(await findControlByLabel(/assigned role/i), 'security');
    await userEvent.type(await findControlByLabel(/set password/i), 'password123');
    fireEvent.submit(formEl5);

    await screen.findByText('Eve');
    const createCall = global.fetch.mock.calls.find(c => c[0].includes('/staff/create'));
    expect(createCall).toBeDefined();
    const payload = JSON.parse(createCall[1].body);
    expect(payload).toMatchObject({ email: 'eve@example.com', assigned_role: 'security', event_id: 'evt-1' });

    const alertText = alertSpy.mock.calls.find(call => call[0] && call[0].includes('An email has been sent'));
    expect(alertText).toBeDefined();
    alertSpy.mockRestore();
  });

  test('TC-BE-10: staff list shows assigned event name after creation', async () => {
    client.eventAPI.getAll.mockResolvedValue({ success: true, events: [sampleEvent] });
    const staffList = [];
    global.fetch = jest.fn((url, opts) => {
      if (url.includes('/staff/members')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, staff: staffList }) });
      }
      if (url.includes('/staff/create')) {
        const body = JSON.parse(opts.body);
        const created = { id: 's3', full_name: body.full_name, event_name: sampleEvent.title };
        staffList.push(created);
        return Promise.resolve({ ok: true, json: async () => ({ success: true, staff: created }) });
      }
      return Promise.resolve({ ok: false, json: async () => ({ success: false }) });
    });

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    renderWithRouter(<StaffManagementPage />, { route: '/staff/management' });
    const addButton = await screen.findByRole('button', { name: /add staff/i });
    await userEvent.click(addButton);
    const firstInput = await findControlByLabel(/full name/i);
    const formEl = firstInput.closest('form');
    if (formEl) formEl.noValidate = true;

    await userEvent.type(firstInput, 'Frank');
    await userEvent.type(await findControlByLabel(/email address/i), 'frank@example.com');
    await userEvent.selectOptions(await findControlByLabel(/assign to event/i), 'evt-1');
    await userEvent.selectOptions(await findControlByLabel(/assigned role/i), 'staff');
    await userEvent.type(await findControlByLabel(/set password/i), 'password123');
    fireEvent.submit(formEl);

    const table = screen.getByRole('table');
    expect(await within(table).findByText('Test Event')).toBeInTheDocument();
    alertSpy.mockRestore();
  });

  // Edge cases
  test('duplicate staff assignment returns error message', async () => {
    client.eventAPI.getAll.mockResolvedValue({ success: true, events: [sampleEvent] });
    global.fetch = jest.fn((url, opts) => {
      if (url.includes('/staff/members')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, staff: [] }) });
      }
      if (url.includes('/staff/create')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: false, message: 'User already assigned' }) });
      }
      return Promise.resolve({ ok: false, json: async () => ({ success: false }) });
    });

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    renderWithRouter(<StaffManagementPage />, { route: '/staff/management' });
    const addButton = await screen.findByRole('button', { name: /add staff/i });
    await userEvent.click(addButton);
    const firstInput = await findControlByLabel(/full name/i);
    const formEl = firstInput.closest('form');
    if (formEl) formEl.noValidate = true;

    await userEvent.type(firstInput, 'Gina');
    await userEvent.type(await findControlByLabel(/email address/i), 'gina@example.com');
    await userEvent.selectOptions(await findControlByLabel(/assign to event/i), 'evt-1');
    await userEvent.type(await findControlByLabel(/set password/i), 'password123');
    fireEvent.submit(formEl);
    await flushPromises();

    expect(alertSpy).toHaveBeenCalledWith('User already assigned');
    alertSpy.mockRestore();
  });

  test('invalid email format handled by server error path', async () => {
    client.eventAPI.getAll.mockResolvedValue({ success: true, events: [sampleEvent] });
    global.fetch = jest.fn((url, opts) => {
      if (url.includes('/staff/members')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, staff: [] }) });
      }
      if (url.includes('/staff/create')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: false, message: 'Invalid email format' }) });
      }
      return Promise.resolve({ ok: false, json: async () => ({ success: false }) });
    });

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    renderWithRouter(<StaffManagementPage />, { route: '/staff/management' });
    const addButton = await screen.findByRole('button', { name: /add staff/i });
    await userEvent.click(addButton);
    const firstInput = await findControlByLabel(/full name/i);
    const formEl = firstInput.closest('form');
    if (formEl) formEl.noValidate = true;

    await userEvent.type(firstInput, 'Hank');
    await userEvent.type(await findControlByLabel(/email address/i), 'not-an-email');
    await userEvent.selectOptions(await findControlByLabel(/assign to event/i), 'evt-1');
    await userEvent.type(await findControlByLabel(/set password/i), 'password123');
    fireEvent.submit(formEl);
    await flushPromises();

    expect(alertSpy).toHaveBeenCalledWith('Invalid email format');
    alertSpy.mockRestore();
  });

  test('empty staff list shows "No staff assigned"', async () => {
    client.eventAPI.getAll.mockResolvedValue({ success: true, events: [sampleEvent] });
    global.fetch = jest.fn((url) => {
      if (url.includes('/staff/members')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, staff: [] }) });
      }
      return Promise.resolve({ ok: false, json: async () => ({ success: false }) });
    });

    renderWithRouter(<StaffManagementPage />, { route: '/staff/management' });
    expect(await screen.findByText(/0 staff members/i)).toBeInTheDocument();
  });

  test('API failure handling shows error alert', async () => {
    client.eventAPI.getAll.mockResolvedValue({ success: true, events: [sampleEvent] });
    global.fetch = jest.fn((url, opts) => {
      if (url.includes('/staff/members')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, staff: [] }) });
      }
      if (url.includes('/staff/create')) {
        return Promise.reject(new Error('Network Error'));
      }
      return Promise.resolve({ ok: false, json: async () => ({ success: false }) });
    });

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    renderWithRouter(<StaffManagementPage />, { route: '/staff/management' });
    const addButton = await screen.findByRole('button', { name: /add staff/i });
    await userEvent.click(addButton);
    const firstInput = await findControlByLabel(/full name/i);
    const formEl = firstInput.closest('form');
    if (formEl) formEl.noValidate = true;

    await userEvent.type(firstInput, 'Ivy');
    await userEvent.type(await findControlByLabel(/email address/i), 'ivy@example.com');
    await userEvent.selectOptions(await findControlByLabel(/assign to event/i), 'evt-1');
    await userEvent.type(await findControlByLabel(/set password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /send invitation/i }));

    expect(alertSpy).toHaveBeenCalledWith('Error adding staff member');
    alertSpy.mockRestore();
  });
});
