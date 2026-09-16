import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateHMAC } from '../lib/auth';
import { sendSuccess, sendError, sendValidationError } from '../lib/response';
import { config, validateConfig } from '../lib/config';
import type { AccessTokenRequest, AccessTokenResponse } from '../lib/types';

/**
 * POST /api/checkout/access-token
 * Generate access token for Shiprocket checkout
 * This endpoint is called from your frontend when user clicks checkout
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
        'Server configuration error. Please contact administrator.',
        500,
        'CONFIG_ERROR'
      );
    }

    // Parse request body
    const { cart_data, redirect_url } = req.body;

    // Validate required fields
    if (!cart_data || !cart_data.items || !Array.isArray(cart_data.items)) {
      return sendValidationError(res, 'cart_data.items is required and must be an array');
    }

    if (cart_data.items.length === 0) {
      return sendValidationError(res, 'cart_data.items cannot be empty');
    }

    // Validate each cart item
    for (const item of cart_data.items) {
      if (!item.variant_id || !item.quantity) {
        return sendValidationError(res, 'Each cart item must have variant_id and quantity');
      }
      if (typeof item.quantity !== 'number' || item.quantity < 1) {
        return sendValidationError(res, 'Item quantity must be a positive number');
      }
    }

    // Use provided redirect_url or default
    const finalRedirectUrl = redirect_url || `${config.websiteBaseUrl}${config.checkoutSuccessUrl}`;

    // Prepare request payload for Shiprocket
    const timestamp = new Date().toISOString();
    const payload: AccessTokenRequest = {
      cart_data,
      redirect_url: finalRedirectUrl,
      timestamp
    };

    // Generate HMAC signature
    const hmacSignature = generateHMAC(payload, config.shiprocketApiSecret);

    // Call Shiprocket Access Token API
    const shiprocketUrl = `${config.shiprocketBaseUrl}/api/v1/access-token/checkout`;
    
    console.log('Calling Shiprocket access token API:', shiprocketUrl);
    
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
        responseData.message || 'Failed to generate checkout token',
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

    // Return token and order_id to frontend
    const result: AccessTokenResponse = {
      token: responseData.result.token,
      order_id: responseData.result.order_id
    };

    return sendSuccess(res, result);

  } catch (error) {
    console.error('Error generating access token:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
