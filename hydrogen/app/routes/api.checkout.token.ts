import type {Route} from './+types/api.checkout.token';
import handler from '~/server/handlers/checkout-token.js';
import {handleApi} from '~/server/lib/http.js';

// POST /api/checkout/token
// Resource route: GET/OPTIONS arrive in `loader`, everything else in `action`.
export async function loader({request, context}: Route.LoaderArgs) {
  return handleApi(handler, request, context.env);
}

export async function action({request, context}: Route.ActionArgs) {
  return handleApi(handler, request, context.env);
}
