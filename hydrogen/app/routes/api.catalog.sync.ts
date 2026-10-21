import type {Route} from './+types/api.catalog.sync';
import handler from '~/server/handlers/catalog-sync.js';
import {handleApi} from '~/server/lib/http.js';

// GET|POST /api/catalog/sync
// Resource route: GET/OPTIONS arrive in `loader`, everything else in `action`.
export async function loader({request, context}: Route.LoaderArgs) {
  return handleApi(handler, request, context.env);
}

export async function action({request, context}: Route.ActionArgs) {
  return handleApi(handler, request, context.env);
}
