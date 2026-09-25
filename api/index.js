// ==============================================================================
// Vercel Serverless Function Entrypoint for UNION.AI Express Backend
// ==============================================================================
const { createApp } = require('../packages/server/dist/app.js');

const app = createApp();

module.exports = app;
