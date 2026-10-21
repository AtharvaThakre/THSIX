import type {Route} from './+types/api.catalog.products';
import handler from '~/server/handlers/catalog-products.js';
import {handleApi} from '~/server/lib/http.js';

// GET /api/catalog/products
// Resource route: GET/OPTIONS arrive in `loader`, everything else in `action`.
export async function loader({request, context}: Route.LoaderArgs) {
  return handleApi(handler, request, context.env);
}

export async function action({request, context}: Route.ActionArgs) {
  return handleApi(handler, request, context.env);
}
