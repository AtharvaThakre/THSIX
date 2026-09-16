import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchCollections } from '../lib/data-service';
import { sendSuccess, sendValidationError } from '../lib/response';
import { config } from '../lib/config';

/**
 * GET /api/catalog/collections
 * Fetch all collections with pagination
 * Query params: page (default: 1), limit (default: 100, max: 250)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(
      parseInt(req.query.limit as string) || config.defaultPageLimit,
      config.maxPageLimit
    );

    // Validate pagination
    if (page < 1) {
      return sendValidationError(res, 'Page number must be >= 1');
    }

    if (limit < 1) {
      return sendValidationError(res, 'Limit must be >= 1');
    }

    // Fetch collections
    const result = fetchCollections(page, limit);

    // Return response in Shiprocket format
    return sendSuccess(res, {
      total: result.total,
      collections: result.collections
    });

  } catch (error) {
    console.error('Error fetching collections:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
