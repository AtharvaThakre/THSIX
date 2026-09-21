const { fetchProductsByCollection } = require('../lib/data-service');
const { sendSuccess, sendValidationError } = require('../lib/response');
const { config } = require('../lib/config');

/**
 * GET /api/catalog/products-by-collection
 * Fetch products by collection ID with pagination
 * Query params: collection_id (required), page (default: 1), limit (default: 100, max: 250)
 */
module.exports = async function handler(req, res) {
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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get collection_id from query params
    const collectionId = req.query.collection_id;
    
    if (!collectionId) {
      return sendValidationError(res, 'collection_id query parameter is required');
    }

    // Parse pagination parameters
    const pageParam = req.query.page;
    const limitParam = req.query.limit;
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
    const result = await fetchProductsByCollection(collectionId, page, limit);

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
};
