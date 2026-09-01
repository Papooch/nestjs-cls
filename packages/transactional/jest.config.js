const { base, esmTransform } = require('../../jest.base.config.js');
module.exports = { ...base, transform: esmTransform('../..') };
