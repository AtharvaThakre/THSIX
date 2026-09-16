import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateHMAC } from '../lib/auth';
import { sendSuccess, sendError, sendValidationError } from '../lib/response';
import { config, validateConfig } from '../lib/config';
import type { OrderDetailsRequest } from '../lib/types';

/**
 * POST /api/checkout/order-details
 * Fetch order details from Shiprocket using order ID
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

    // Parse request body
    const { order_id } = req.body;

    // Validate required fields
    if (!order_id) {
      return sendValidationError(res, 'order_id is required');
    }

    // Prepare request payload
    const timestamp = new Date().toISOString();
    const payload: OrderDetailsRequest = {
      order_id,
      timestamp
    };

    // Generate HMAC signature
    const hmacSignature = generateHMAC(payload, config.shiprocketApiSecret);

    // Call Shiprocket Order Details API
    const shiprocketUrl = `${config.shiprocketBaseUrl}/api/v1/custom-platform-order/details`;
    
    console.log('Fetching order details from Shiprocket:', order_id);
    
    const response = await fetch(shiprocketUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': config.shiprocketApiKey,
        'X-Api-HMAC-SHA256': hmacSignature
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Shiprocket API error:', responseData);
      return sendError(
        res,
        responseData.message || 'Failed to fetch order details',
        response.status,
        'SHIPROCKET_ERROR'
      );
    }

    // Check if response has the expected structure
    if (!responseData.ok || !responseData.result) {
      console.error('Unexpected Shiprocket response:', responseData);
      return sendError(
        res,
        'Invalid response from Shiprocket',
        500,
        'INVALID_RESPONSE'
      );
    }

    // Return order details
    return sendSuccess(res, responseData.result);

  } catch (error) {
    console.error('Error fetching order details:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
