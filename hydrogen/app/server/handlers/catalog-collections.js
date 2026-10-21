import { fetchCollections } from '../lib/data-service.js';
import { catalogHandler } from '../lib/response.js';

/**
 * GET /api/catalog/collections?page=1&limit=100
 * Shiprocket's "Fetch Collections" catalogue API.
 */
export default catalogHandler('collections', (_query, { page, limit }) => fetchCollections(page, limit));
