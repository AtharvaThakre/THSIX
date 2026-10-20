import { fetchProducts } from '../lib/data-service.js';
import { catalogHandler } from '../lib/response.js';

/**
 * GET /api/catalog/products?page=1&limit=100
 * Shiprocket's "Fetch Products" catalogue API.
 */
export default catalogHandler('products', (req, { page, limit }) => fetchProducts(page, limit));
