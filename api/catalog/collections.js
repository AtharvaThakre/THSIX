const { fetchCollections } = require('../lib/data-service');
const { sendSuccess, sendValidationError } = require('../lib/response');
const { config } = require('../lib/config');

/**
 * GET /api/catalog/collections
 * Fetch all collections with pagination
 * Query params: page (default: 1), limit (default: 100, max: 250)
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

    // Fetch collections
    const result = await fetchCollections(page, limit);

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
};