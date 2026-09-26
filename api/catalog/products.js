const { fetchProducts } = require('../lib/data-service');
const { catalogHandler } = require('../lib/response');

/**
 * GET /api/catalog/products?page=1&limit=100
 * Shiprocket's "Fetch Products" catalogue API.
 */
module.exports = catalogHandler('products', (req, { page, limit }) => fetchProducts(page, limit));
