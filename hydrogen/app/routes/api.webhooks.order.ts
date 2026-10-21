import type {Route} from './+types/api.webhooks.order';
import handler from '~/server/handlers/webhook-order.js';
import {handleApi} from '~/server/lib/http.js';

// POST /api/webhooks/order
// Resource route: GET/OPTIONS arrive in `loader`, everything else in `action`.
export async function loader({request, context}: Route.LoaderArgs) {
  return handleApi(handler, request, context.env);
}

export async function action({request, context}: Route.ActionArgs) {
  return handleApi(handler, request, context.env);
}
