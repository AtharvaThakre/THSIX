import { config } from '../lib/config.js';
import { isConfigured, shiprocketPost } from '../lib/shiprocket.js';
import { fetchProducts, fetchCollections } from '../lib/data-service.js';
import { hasCronSecret } from '../lib/webhook-auth.js';
import { jsonResponder } from '../lib/http.js';

/**
 * GET /api/catalog/sync
 * Pushes every Shopify product and collection to Shiprocket's catalogue webhooks
 * (/wh/v1/custom/product and /wh/v1/custom/collection), so prices, stock and new sizes
 * reach Shiprocket without waiting for it to re-read /api/catalog/*.
 *
 * Oxygen has no cron: .github/workflows/catalog-sync.yml calls it daily, and it can be called
 * by hand after editing products:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://www.thsix.com/api/catalog/sync
 */
export default async function handler(request) {
  const reply = jsonResponder({ 'Cache-Control': 'no-store' });

  if (!hasCronSecret(request)) {
    return reply(401, { ok: false, message: 'Unauthorized' });
  }
  if (!isConfigured()) {
    return reply(500, { ok: false, message: 'SHIPROCKET_API_KEY / SHIPROCKET_API_SECRET are not set' });
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

    return reply(failures.length ? 502 : 200, {
      ok: failures.length === 0,
      products: products.length,
      collections: collections.length,
      failures,
    });
  } catch (error) {
    console.error('[catalog-sync] Failed:', error);
    return reply(500, { ok: false, message: error.message });
  }
};
