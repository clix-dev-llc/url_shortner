/* eslint-disable import/no-dynamic-require */
const env = process.env.NODE_ENV || 'development';
const config = require(`./env/${env}`);

module.exports = config;
