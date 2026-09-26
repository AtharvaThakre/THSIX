const { config } = require('./config');

/**
 * Response helpers for the catalogue endpoints Shiprocket reads.
 */
function sendSuccess(res, data) {
  return res.status(200).json({ ok: true, data, errorCode: null });
}

function sendValidationError(res, message) {
  return res.status(400).json({ ok: false, result: null, errorCode: 'VALIDATION_ERROR', message });
}

/**
 * Parses ?page=&limit=. Returns { page, limit } or { error }.
 */
function parsePagination(query) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? config.defaultPageLimit : Number(query.limit);

  if (!Number.isInteger(page) || page < 1) {
    return { error: 'page must be a whole number >= 1' };
  }
  if (!Number.isInteger(limit) || limit < 1) {
    return { error: 'limit must be a whole number >= 1' };
  }
  return { page, limit: Math.min(limit, config.maxPageLimit) };
}

/**
 * Wraps a GET catalogue handler: CORS, method check, pagination and error handling.
 * `load(req, { page, limit })` returns the response data, or a string validation error.
 */
function catalogHandler(name, load) {
  return async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    if (req.method !== 'GET') {
      return res.status(405).json({ ok: false, message: 'Method not allowed' });
    }

    const pagination = parsePagination(req.query || {});
    if (pagination.error) {
      return sendValidationError(res, pagination.error);
    }

    try {
      const data = await load(req, pagination);
      return typeof data === 'string' ? sendValidationError(res, data) : sendSuccess(res, data);
    } catch (error) {
      console.error(`[catalog] ${name} failed:`, error);
      return res.status(500).json({ ok: false, errorCode: 'INTERNAL_ERROR', message: 'Internal server error' });
    }
  };
}

module.exports = {
  catalogHandler,
};
