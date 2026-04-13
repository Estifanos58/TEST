const userRegistration = require('./userRegistration');
const accountStatus = require('./accountStatus');
const organizerStatus = require('./organizerStatus');
const organizerApplicationReceived = require('./organizerApplicationReceived');
const passwordReset = require('./passwordReset');
const staffInvitation = require('./staffInvitation');
const ticketConfirmation = require('./ticketConfirmation');
const eventReminder = require('./eventReminder');
const moderationNotice = require('./moderationNotice');

module.exports = {
  userRegistration,
  accountStatus,
  organizerStatus,
  organizerApplicationReceived,
  passwordReset,
  staffInvitation,
  ticketConfirmation,
  eventReminder,
  moderationNotice
};

// Update for: feat(controlroom): add draft/publish screens with validation UX
// Update for: feat(controlroom): add event list query params and filter persistence for organizer screens