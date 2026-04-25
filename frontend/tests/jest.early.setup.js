// Early setup executed before test framework to stub globals that jsdom may not implement
// Provide a basic alert implementation so jsdom won't throw 'Not implemented: window.alert'
if (typeof global.alert !== 'function') {
  global.alert = () => {};
}
if (typeof window !== 'undefined' && typeof window.alert !== 'function') {
  window.alert = global.alert;
}
// Ensure URL.createObjectURL/revokeObjectURL exist in the test env
if (typeof URL !== 'undefined') {
  if (typeof URL.createObjectURL !== 'function') {
    URL.createObjectURL = () => 'blob:mock';
  }
  if (typeof URL.revokeObjectURL !== 'function') {
    URL.revokeObjectURL = () => {};
  }
}
