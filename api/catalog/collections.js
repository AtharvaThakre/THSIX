const { fetchCollections } = require('../lib/data-service');
const { catalogHandler } = require('../lib/response');

/**
 * GET /api/catalog/collections?page=1&limit=100
 * Shiprocket's "Fetch Collections" catalogue API.
 */
module.exports = catalogHandler('collections', (req, { page, limit }) => fetchCollections(page, limit));
