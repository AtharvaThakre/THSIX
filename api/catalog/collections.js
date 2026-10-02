const { fetchCollections } = require('../_lib/data-service');
const { catalogHandler } = require('../_lib/response');

/**
 * GET /api/catalog/collections?page=1&limit=100
 * Shiprocket's "Fetch Collections" catalogue API.
 */
module.exports = catalogHandler('collections', (req, { page, limit }) => fetchCollections(page, limit));
