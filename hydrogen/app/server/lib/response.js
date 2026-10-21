import { config } from './config.js';
import { jsonResponder, queryParams } from './http.js';

/**
 * Response helpers for the catalogue endpoints Shiprocket reads.
 */
function sendSuccess(reply, data) {
  return reply(200, { ok: true, data, errorCode: null });
}

function sendValidationError(reply, message) {
  return reply(400, { ok: false, result: null, errorCode: 'VALIDATION_ERROR', message });
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
 * `load(query, { page, limit })` returns the response data, or a string validation error.
 */
function catalogHandler(name, load) {
  return async function handler(request) {
    const reply = jsonResponder({
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });

    if (request.method === 'OPTIONS') {
      return reply(200);
    }
    if (request.method !== 'GET') {
      return reply(405, { ok: false, message: 'Method not allowed' });
    }

    const query = queryParams(request);
    const pagination = parsePagination(query);
    if (pagination.error) {
      return sendValidationError(reply, pagination.error);
    }

    try {
      const data = await load(query, pagination);
      return typeof data === 'string' ? sendValidationError(reply, data) : sendSuccess(reply, data);
    } catch (error) {
      console.error(`[catalog] ${name} failed:`, error);
      return reply(500, { ok: false, errorCode: 'INTERNAL_ERROR', message: 'Internal server error' });
    }
  };
}

export { catalogHandler, };
