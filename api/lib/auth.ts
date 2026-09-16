import crypto from 'crypto';

/**
 * Generates HMAC SHA256 signature for Shiprocket API authentication
 * @param data - The request body as string or object
 * @param secret - API Secret Key
 * @returns Base64 encoded HMAC SHA256 signature
 */
export function generateHMAC(data: string | object, secret: string): string {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('base64');
}

/**
 * Verifies HMAC signature from incoming webhook requests
 * @param data - The request body as string or object
 * @param signature - The signature from X-Api-HMAC-SHA256 header
 * @param secret - API Secret Key
 * @returns true if signature is valid
 */
export function verifyHMAC(data: string | object, signature: string, secret: string): boolean {
  const expectedSignature = generateHMAC(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Validates API Key from request headers
 * @param apiKey - The API key from X-Api-Key header
 * @param expectedKey - Expected API key from environment
 * @returns true if API key is valid
 */
export function validateApiKey(apiKey: string | undefined, expectedKey: string): boolean {
  if (!apiKey || !expectedKey) {
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(apiKey),
    Buffer.from(expectedKey)
  );
}

/**
 * Middleware to authenticate Shiprocket webhook requests
 */
export function authenticateWebhook(
  apiKey: string | undefined,
  hmacSignature: string | undefined,
  requestBody: string | object,
  expectedApiKey: string,
  apiSecret: string
): { authenticated: boolean; error?: string } {
  // Validate API Key
  if (!validateApiKey(apiKey, expectedApiKey)) {
    return {
      authenticated: false,
      error: 'Invalid or missing X-Api-Key header'
    };
  }

  // Validate HMAC signature
  if (!hmacSignature) {
    return {
      authenticated: false,
      error: 'Missing X-Api-HMAC-SHA256 header'
    };
  }

  try {
    if (!verifyHMAC(requestBody, hmacSignature, apiSecret)) {
      return {
        authenticated: false,
        error: 'Invalid HMAC signature'
      };
    }
  } catch (error) {
    return {
      authenticated: false,
      error: 'HMAC verification failed'
    };
  }

  return { authenticated: true };
}
