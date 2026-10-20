import type {Route} from './+types/api.catalog.collections';
import handler from '~/server/handlers/catalog-collections.js';
import {runApiHandler} from '~/server/run-api-handler';

// GET /api/catalog/collections
// Resource route: GET/OPTIONS arrive in `loader`, everything else in `action`.
export async function loader({request, context}: Route.LoaderArgs) {
  return runApiHandler(handler, request, context.env);
}

export async function action({request, context}: Route.ActionArgs) {
  return runApiHandler(handler, request, context.env);
}
