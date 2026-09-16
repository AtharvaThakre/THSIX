import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateHMAC } from '../lib/auth';
import { sendSuccess, sendError } from '../lib/response';
import { config, validateConfig } from '../lib/config';
import type { ShiprocketCollection } from '../lib/types';

/**
 * POST /api/webhooks/collection-update
 * Webhook to sync collection updates TO Shiprocket
 * Call this endpoint when a collection is created or updated in your system
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

    // Parse collection data from request
    const collectionData: ShiprocketCollection = req.body;

    // Validate required collection fields
    if (!collectionData.id || !collectionData.title) {
      return sendError(res, 'Missing required collection fields: id, title', 400);
    }

    // Generate HMAC signature
    const hmacSignature = generateHMAC(collectionData, config.shiprocketApiSecret);

    // Send to Shiprocket collection webhook
    const shiprocketUrl = `${config.shiprocketBaseUrl}/wh/v1/custom/collection`;

    console.log('Syncing collection to Shiprocket:', collectionData.id);

    const response = await fetch(shiprocketUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': config.shiprocketApiKey,
        'X-Api-HMAC-SHA256': hmacSignature
      },
      body: JSON.stringify(collectionData)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Shiprocket collection webhook error:', responseData);
      return sendError(
        res,
        responseData.message || 'Failed to sync collection to Shiprocket',
        response.status,
        'SHIPROCKET_ERROR'
      );
    }

    console.log('Collection synced successfully:', collectionData.id);

    return sendSuccess(res, {
      synced: true,
      collection_id: collectionData.id,
      message: 'Collection synced to Shiprocket successfully'
    });

  } catch (error) {
    console.error('Error syncing collection:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
