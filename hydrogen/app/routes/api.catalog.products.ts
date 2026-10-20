import type {Route} from './+types/api.catalog.products';
import handler from '~/server/handlers/catalog-products.js';
import {runApiHandler} from '~/server/run-api-handler';

// GET /api/catalog/products
// Resource route: GET/OPTIONS arrive in `loader`, everything else in `action`.
export async function loader({request, context}: Route.LoaderArgs) {
  return runApiHandler(handler, request, context.env);
}

export async function action({request, context}: Route.ActionArgs) {
  return runApiHandler(handler, request, context.env);
}
