import { config } from '../lib/config.js';
import { isConfigured, shiprocketPost } from '../lib/shiprocket.js';
import { isAdminConfigured } from '../lib/admin-token.js';
import { jsonResponder } from '../lib/http.js';

/**
 * GET /api/checkout/health
 * Reports whether the Shiprocket keys are set and accepted, without exposing them.
 * It makes a harmless signed call (order list for the last minute): 511/401 means the
 * key or secret is wrong, 200 means Shiprocket accepted the signature.
 */
export default async function handler() {
  const reply = jsonResponder({ 'Cache-Control': 'no-store' });

  const report = {
    apiKeySet: Boolean(config.shiprocketApiKey),
    apiSecretSet: Boolean(config.shiprocketApiSecret),
    baseUrl: config.shiprocketBaseUrl,
    redirectUrl: `${config.websiteBaseUrl}${config.checkoutSuccessUrl}`,
    shopifyOrderSync: isAdminConfigured(),
    catalogSyncSecretSet: Boolean(config.cronSecret),
    webhookSecretSet: Boolean(config.webhookSecret),
    // Partial-COD advance applied to every COD order (0 = off)
    partialCodAdvance: config.partialCodAdvance,
    metaCapiConfigured: Boolean(config.metaPixelId && config.metaCAPIToken),
    credentialsAccepted: null,
    shiprocketStatus: null,
  };

  if (!isConfigured()) {
    return reply(200, { ok: false, ...report, message: 'Set SHIPROCKET_API_KEY and SHIPROCKET_API_SECRET in the Oxygen environment.' });
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

  return reply(200, { ok: report.credentialsAccepted === true, ...report });
};
