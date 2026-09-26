const { config } = require('../lib/config');
const { isConfigured, shiprocketPost } = require('../lib/shiprocket');
const { fetchProducts, fetchCollections } = require('../lib/data-service');

/**
 * GET /api/catalog/sync
 * Pushes every Shopify product and collection to Shiprocket's catalogue webhooks
 * (/wh/v1/custom/product and /wh/v1/custom/collection), so prices, stock and new sizes
 * reach Shiprocket without waiting for it to re-read /api/catalog/*.
 *
 * Runs daily from Vercel Cron (see vercel.json). Call it by hand after editing products:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://www.thsix.com/api/catalog/sync
 */
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!config.cronSecret || req.headers.authorization !== `Bearer ${config.cronSecret}`) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }
  if (!isConfigured()) {
    return res.status(500).json({ ok: false, message: 'SHIPROCKET_API_KEY / SHIPROCKET_API_SECRET are not set' });
  }

  try {
    const [{ products }, { collections }] = await Promise.all([
      fetchProducts(1, config.maxPageLimit),
      fetchCollections(1, config.maxPageLimit),
    ]);

    const failures = [];
    const push = async (path, item, kind) => {
      const response = await shiprocketPost(path, item);
      if (response.status === 401 || response.status === 511) {
        throw new Error('Shiprocket rejected the API key/secret');
      }
      if (!response.ok) {
        failures.push({ kind, id: item.id, status: response.status, body: response.text.slice(0, 300) });
      }
    };

    // Sequential: a handful of items, and Shiprocket rate-limits bursts
    for (const collection of collections) {
      await push('/wh/v1/custom/collection', collection, 'collection');
    }
    for (const product of products) {
      await push('/wh/v1/custom/product', product, 'product');
    }

    if (failures.length) {
      console.error('[catalog-sync] Some items were rejected:', JSON.stringify(failures));
    }

    return res.status(failures.length ? 502 : 200).json({
      ok: failures.length === 0,
      products: products.length,
      collections: collections.length,
      failures,
    });
  } catch (error) {
    console.error('[catalog-sync] Failed:', error);
    return res.status(500).json({ ok: false, message: error.message });
  }
};
