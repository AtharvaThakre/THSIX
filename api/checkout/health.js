const { config } = require('../lib/config');
const { isConfigured, shiprocketPost } = require('../lib/shiprocket');

/**
 * GET /api/checkout/health
 * Reports whether the Shiprocket keys are set and accepted, without exposing them.
 * It makes a harmless signed call (order list for the last minute): 511/401 means the
 * key or secret is wrong, 200 means Shiprocket accepted the signature.
 */
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const report = {
    apiKeySet: Boolean(config.shiprocketApiKey),
    apiSecretSet: Boolean(config.shiprocketApiSecret),
    baseUrl: config.shiprocketBaseUrl,
    redirectUrl: `${config.websiteBaseUrl}${config.checkoutSuccessUrl}`,
    shopifyOrderSync: Boolean(config.shopifyAdminToken),
    catalogSyncSecretSet: Boolean(config.cronSecret),
    credentialsAccepted: null,
    shiprocketStatus: null,
  };

  if (!isConfigured()) {
    return res.status(200).json({ ok: false, ...report, message: 'Set SHIPROCKET_API_KEY and SHIPROCKET_API_SECRET in Vercel.' });
  }

  const now = new Date();
  try {
    const response = await shiprocketPost('/api/v1/custom-platform-order/details/list', {
      startDate: new Date(now.getTime() - 60 * 1000).toISOString(),
      endDate: now.toISOString(),
      timestamp: now.toISOString(),
      limit: 1,
      page: 0,
    });
    report.shiprocketStatus = response.status;
    report.credentialsAccepted = response.status !== 401 && response.status !== 511;
    if (!report.credentialsAccepted) {
      report.message = 'Shiprocket rejected the API key/secret. Copy them again from Shiprocket Checkout > Settings > API.';
    }
  } catch (error) {
    report.message = `Could not reach Shiprocket: ${error.message}`;
  }

  return res.status(200).json({ ok: report.credentialsAccepted === true, ...report });
};
