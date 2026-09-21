import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GET /api/test
 * Simple test endpoint to verify API deployment works
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      ok: false,
      errorCode: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed' 
    });
  }

  try {
    const response = {
      ok: true,
      result: {
        message: 'API is working correctly!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        endpoint: '/api/test'
      }
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Test API error:', error);
    return res.status(500).json({
      ok: false,
      errorCode: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
}