const { fetchProducts } = require('../_lib/data-service');
const { catalogHandler } = require('../_lib/response');

/**
 * GET /api/catalog/products?page=1&limit=100
 * Shiprocket's "Fetch Products" catalogue API.
 */
module.exports = catalogHandler('products', (req, { page, limit }) => fetchProducts(page, limit));
