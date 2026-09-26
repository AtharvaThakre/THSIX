const { fetchProductsByCollection } = require('../lib/data-service');
const { catalogHandler } = require('../lib/response');

/**
 * GET /api/catalog/products-by-collection?collection_id=123&page=1&limit=100
 * Shiprocket's "Fetch Products by Collection" catalogue API.
 */
module.exports = catalogHandler('products-by-collection', (req, { page, limit }) => {
  const collectionId = String(req.query.collection_id || '');
  if (!/^\d+$/.test(collectionId)) {
    return 'collection_id must be a numeric collection ID';
  }
  return fetchProductsByCollection(collectionId, page, limit);
});
