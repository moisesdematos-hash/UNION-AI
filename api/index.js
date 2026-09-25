// ==============================================================================
// Vercel Serverless Function Entrypoint with Diagnostic Handling
// ==============================================================================
let app = null;
let initError = null;

try {
  const { createApp } = require('../packages/server/dist/app.js');
  app = createApp();
} catch (err) {
  initError = err;
  console.error('[Vercel Serverless Init Error]:', err);
}

module.exports = (req, res) => {
  if (initError) {
    return res.status(500).json({
      status: 'error',
      source: 'vercel-serverless-init',
      message: initError.message || String(initError),
      stack: initError.stack
    });
  }

  try {
    return app(req, res);
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      source: 'express-handler',
      message: err.message || String(err),
      stack: err.stack
    });
  }
};
