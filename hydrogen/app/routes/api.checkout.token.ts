import type {Route} from './+types/api.checkout.token';
import handler from '~/server/handlers/checkout-token.js';
import {runApiHandler} from '~/server/run-api-handler';

// POST /api/checkout/token
// Resource route: GET/OPTIONS arrive in `loader`, everything else in `action`.
export async function loader({request, context}: Route.LoaderArgs) {
  return runApiHandler(handler, request, context.env);
}

export async function action({request, context}: Route.ActionArgs) {
  return runApiHandler(handler, request, context.env);
}
