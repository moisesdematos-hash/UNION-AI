// ==============================================================================
// Vercel Serverless Function Entrypoint with Dynamic ESM Loading
// ==============================================================================
let appPromise = null;

async function getApp() {
  if (!appPromise) {
    appPromise = import('../packages/server/dist/app.js')
      .then((mod) => mod.createApp())
      .catch((err) => {
        appPromise = null; // Do not permanently cache rejection
        throw err;
      });
  }
  return appPromise;
}

module.exports = async (req, res) => {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    console.error('[Vercel Serverless Entrypoint Error]:', err);
    const isProduction = process.env.NODE_ENV === 'production';
    const message = isProduction
      ? 'Ocorreu um erro interno no servidor. Por favor, tente novamente mais tarde.'
      : (err.message || String(err));
    return res.status(500).json({
      status: 'error',
      source: 'vercel-serverless-entrypoint',
      message
    });
  }
};
