const crypto = require('node:crypto');

process.env.JWT_SECRET ||= crypto.randomBytes(32).toString('hex');
process.env.JWT_REFRESH_SECRET ||= crypto.randomBytes(32).toString('hex');
process.env.AUDIT_SIGNING_KEY ||= crypto.randomBytes(32).toString('hex');
process.env.AUDIT_SIGNING_KEY_ID ||= 'jest-ephemeral-v1';
process.env.BACKEND_PORT ||= '6096';
