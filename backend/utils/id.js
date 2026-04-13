const { randomUUID } = require('crypto');

const generateId = () => randomUUID().replace(/-/g, '');

module.exports = {
  generateId
};
