import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateHMAC } from '../lib/auth';
import { sendSuccess, sendError } from '../lib/response';
import { config, validateConfig } from '../lib/config';
import type { ShiprocketProduct } from '../lib/types';

/**
 * POST /api/webhooks/product-update
 * Webhook to sync product updates TO Shiprocket
 * Call this endpoint when a product is created or updated in your system
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate configuration
    const configValidation = validateConfig();
    if (!configValidation.valid) {
      console.error('Missing required environment variables:', configValidation.missing);
      return sendError(
        res,
        'Server configuration error',
        500,
        'CONFIG_ERROR'
      );
    }

    // Parse product data from request
    const productData: ShiprocketProduct = req.body;

    // Validate required product fields
    if (!productData.id) {
      return sendError(res, 'Missing required product field: id', 400);
    }
    if (!productData.title) {
      return sendError(res, 'Missing required product field: title', 400);
    }
    if (!productData.variants) {
      return sendError(res, 'Missing required product field: variants', 400);
    }

    // Generate HMAC signature
    const hmacSignature = generateHMAC(productData, config.shiprocketApiSecret);

    // Send to Shiprocket product webhook
    const shiprocketUrl = `${config.shiprocketBaseUrl}/wh/v1/custom/product`;

    console.log('Syncing product to Shiprocket:', productData.id);

    const response = await fetch(shiprocketUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': config.shiprocketApiKey,
        'X-Api-HMAC-SHA256': hmacSignature
      },
      body: JSON.stringify(productData)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Shiprocket product webhook error:', responseData);
      const msg = responseData.message ? responseData.message : 'Failed to sync product to Shiprocket';
      return sendError(res, msg, response.status, 'SHIPROCKET_ERROR');
    }

    console.log('Product synced successfully:', productData.id);

    return sendSuccess(res, {
      synced: true,
      product_id: productData.id,
      message: 'Product synced to Shiprocket successfully'
    });

  } catch (error) {
    console.error('Error syncing product:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
