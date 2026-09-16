import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchProductsByCollection } from '../lib/data-service';
import { sendSuccess, sendValidationError } from '../lib/response';
import { config } from '../lib/config';

/**
 * GET /api/catalog/products-by-collection
 * Fetch products by collection ID with pagination
 * Query params: collection_id (required), page (default: 1), limit (default: 100, max: 250)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get collection_id from query params
    const collectionId = req.query.collection_id as string;

    if (!collectionId) {
      return sendValidationError(res, 'collection_id is required');
    }

    // Parse pagination parameters
    const pageParam = req.query.page as string;
    const limitParam = req.query.limit as string;
    const page = pageParam ? parseInt(pageParam) : 1;
    let limit = limitParam ? parseInt(limitParam) : config.defaultPageLimit;
    if (limit > config.maxPageLimit) {
      limit = config.maxPageLimit;
    }

    // Validate pagination
    if (page < 1) {
      return sendValidationError(res, 'Page number must be >= 1');
    }

    if (limit < 1) {
      return sendValidationError(res, 'Limit must be >= 1');
    }

    // Fetch products by collection
    const result = fetchProductsByCollection(collectionId, page, limit);

    // Return response in Shiprocket format
    return sendSuccess(res, {
      total: result.total,
      products: result.products
    });

  } catch (error) {
    console.error('Error fetching products by collection:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
