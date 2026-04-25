// Register testing-library DOM matchers
require('@testing-library/jest-dom');

// Jest setup: polyfills expected browser globals
if (typeof global.TextEncoder === 'undefined') {
  // Node's util provides TextEncoder
  // eslint-disable-next-line global-require
  global.TextEncoder = require('util').TextEncoder;
}

// Provide URL.createObjectURL if missing (used by CSV download tests)
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'blob:mock';
}

// Provide a no-op alert for jsdom tests
if (typeof global.alert !== 'function') {
  global.alert = jest.fn();
}
if (typeof window !== 'undefined' && typeof window.alert !== 'function') {
  // ensure window.alert exists in jsdom as well
  // attach the jest mock created above
  // eslint-disable-next-line no-undef
  window.alert = global.alert;
}
