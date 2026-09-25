// ==============================================================================
// Vercel Serverless Function Entrypoint with Dynamic ESM Loading
// ==============================================================================
let appPromise = null;

async function getApp() {
  if (!appPromise) {
    appPromise = import('../packages/server/dist/app.js').then((mod) => mod.createApp());
  }
  return appPromise;
}

module.exports = async (req, res) => {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    console.error('[Vercel Serverless Entrypoint Error]:', err);
    return res.status(500).json({
      status: 'error',
      source: 'vercel-serverless-entrypoint',
      message: err.message || String(err),
      stack: err.stack
    });
  }
};
