// Ensure minimal globals expected by some libraries (TextEncoder)
if (typeof global.TextEncoder === 'undefined') {
  // Node's util provides a TextEncoder polyfill in many environments
  // eslint-disable-next-line global-require
  global.TextEncoder = require('util').TextEncoder;
}

const React = require('react');
const { render } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');
const { act } = require('react-dom/test-utils');

function renderWithRouter(ui, { route = '/' } = {}) {
  // If caller already provided a Router (MemoryRouter), don't double-wrap
  try {
    if (ui && ui.type && ui.type === MemoryRouter) {
      return render(ui);
    }
  } catch (e) {
    // ignore and fall back to wrapping
  }

  return render(React.createElement(MemoryRouter, { initialEntries: [route] }, ui));
}

// Use act to flush pending promise microtasks and avoid "not wrapped in act" warnings
const flushPromises = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const setLocalStorageAuth = (
  user = { full_name: 'Test Test', email: 'test@example.com', id: 'user-1' },
  token = 'test-token',
) => {
  localStorage.setItem('authToken', token);
  localStorage.setItem('user', JSON.stringify(user));
};

module.exports = { renderWithRouter, flushPromises, setLocalStorageAuth };
